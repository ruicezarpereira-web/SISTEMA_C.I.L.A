ALTER TABLE public.servidores
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS data_inativacao DATE,
  ADD COLUMN IF NOT EXISTS motivo_inativacao TEXT;

ALTER TABLE public.servidores
  ADD CONSTRAINT servidores_inativacao_coerente
  CHECK (ativo OR data_inativacao IS NOT NULL);

ALTER TABLE public.ocorrencias
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'MANUAL'
    CHECK (origem IN ('IMPORTADO','MANUAL')),
  ADD COLUMN IF NOT EXISTS excluida_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS excluida_por UUID,
  ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT;

UPDATE public.ocorrencias SET origem = 'IMPORTADO';

CREATE INDEX IF NOT EXISTS ocorrencias_servidor_periodo_idx
  ON public.ocorrencias (servidor_id, data_inicio, data_fim);

CREATE TABLE IF NOT EXISTS public.servidores_alteracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  origem TEXT NOT NULL DEFAULT 'IMPORTACAO' CHECK (origem IN ('IMPORTACAO','MANUAL')),
  alterado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  alterado_por UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servidores_alteracoes TO authenticated;
GRANT ALL ON public.servidores_alteracoes TO service_role;
ALTER TABLE public.servidores_alteracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users with role can view servidores_alteracoes" ON public.servidores_alteracoes FOR SELECT TO authenticated USING (public.has_any_role());
CREATE POLICY "Users with role can insert servidores_alteracoes" ON public.servidores_alteracoes FOR INSERT TO authenticated WITH CHECK (public.has_any_role());
CREATE POLICY "Users with role can update servidores_alteracoes" ON public.servidores_alteracoes FOR UPDATE TO authenticated USING (public.has_any_role());
CREATE POLICY "Admins can delete servidores_alteracoes" ON public.servidores_alteracoes FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.garantir_quinquenios_em_aberto(_servidor_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  ult public.quinquenios;
  adm DATE;
  novo_id uuid;
  novo_inicio DATE;
  novo_numero INTEGER;
  i INTEGER;
BEGIN
  IF NOT COALESCE((SELECT ativo FROM public.servidores WHERE id = _servidor_id), false) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.servidores s
    JOIN public.vinculos_com_direito v ON v.vinculo = UPPER(TRIM(s.vinculo))
    WHERE s.id = _servidor_id
  ) THEN
    RETURN;
  END IF;

  FOR i IN 1..20 LOOP
    novo_id := NULL;
    SELECT * INTO ult FROM public.quinquenios
      WHERE servidor_id = _servidor_id ORDER BY numero DESC LIMIT 1;

    IF NOT FOUND THEN
      SELECT data_admissao INTO adm FROM public.servidores WHERE id = _servidor_id;
      IF adm IS NULL THEN RETURN; END IF;
      novo_numero := 1;
      novo_inicio := adm;
    ELSIF ult.status IN ('DEFERIDO', 'ADQUIRIDO_SUGERIDO') THEN
      novo_numero := ult.numero + 1;
      novo_inicio := ult.data_fim_ajustada + 1;
    ELSE
      RETURN;
    END IF;

    INSERT INTO public.quinquenios
      (servidor_id, numero, data_inicio, data_fim_base, data_fim_ajustada, status)
    VALUES
      (_servidor_id, novo_numero, novo_inicio, novo_inicio + 1824, novo_inicio + 1824, 'EM_AQUISICAO')
    ON CONFLICT (servidor_id, numero) DO NOTHING
    RETURNING id INTO novo_id;

    IF novo_id IS NULL THEN RETURN; END IF;
    PERFORM public.recalcular_quinquenio(novo_id);
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalcular_quinquenio(_quinquenio_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  q public.quinquenios;
  soma INTEGER := 0;
  soma_nova INTEGER;
  nova_fim DATE;
  i INTEGER;
BEGIN
  SELECT * INTO q FROM public.quinquenios WHERE id = _quinquenio_id;
  IF NOT FOUND THEN RETURN; END IF;

  nova_fim := q.data_fim_base;

  FOR i IN 1..50 LOOP
    SELECT COALESCE(SUM(o.dias_acrescimo), 0) INTO soma_nova
    FROM public.ocorrencias o
    WHERE o.servidor_id = q.servidor_id
      AND o.excluida_em IS NULL
      AND o.data_inicio <= nova_fim
      AND o.data_fim >= q.data_inicio;

    EXIT WHEN soma_nova = soma AND nova_fim = q.data_fim_base + soma_nova;

    soma := soma_nova;
    nova_fim := q.data_fim_base + soma_nova;
  END LOOP;

  UPDATE public.quinquenios
  SET dias_acrescimo = soma,
      data_fim_ajustada = nova_fim,
      afetado_lc_173_2020 = q.afetado_lc_173_2020,
      status = CASE
        WHEN status IN ('DEFERIDO','INDEFERIDO','RETIFICADO') THEN status
        WHEN nova_fim <= CURRENT_DATE THEN 'ADQUIRIDO_SUGERIDO'
        ELSE 'EM_AQUISICAO'
      END
  WHERE id = _quinquenio_id;
END;
$function$;