CREATE OR REPLACE FUNCTION public.gerar_proximo_quinquenio()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  novo_inicio DATE;
  novo_id uuid;
BEGIN
  IF NEW.status = 'DEFERIDO' AND COALESCE(OLD.status, '') <> 'DEFERIDO' THEN
    novo_inicio := NEW.data_fim_ajustada + 1;
    INSERT INTO public.quinquenios (servidor_id, numero, data_inicio, data_fim_base, data_fim_ajustada, status)
    VALUES (NEW.servidor_id, NEW.numero + 1, novo_inicio, novo_inicio + 1824, novo_inicio + 1824, 'EM_AQUISICAO')
    ON CONFLICT (servidor_id, numero) DO NOTHING
    RETURNING id INTO novo_id;
    IF novo_id IS NOT NULL THEN
      PERFORM public.recalcular_quinquenio(novo_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.vinculos_com_direito (
  vinculo TEXT PRIMARY KEY
);
GRANT SELECT ON public.vinculos_com_direito TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vinculos_com_direito TO authenticated;
GRANT ALL ON public.vinculos_com_direito TO service_role;
ALTER TABLE public.vinculos_com_direito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view vinculos_com_direito" ON public.vinculos_com_direito
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage vinculos_com_direito" ON public.vinculos_com_direito
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.garantir_quinquenios_em_aberto(_servidor_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  ult public.quinquenios;
  adm DATE;
  novo_id uuid;
  novo_inicio DATE;
  novo_numero INTEGER;
  i INTEGER;
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.atualizar_situacao_quinquenios()
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.quinquenios
           WHERE status IN ('EM_AQUISICAO','ADQUIRIDO_SUGERIDO')
  LOOP
    PERFORM public.recalcular_quinquenio(r.id);
  END LOOP;
  FOR r IN SELECT id FROM public.servidores LOOP
    PERFORM public.garantir_quinquenios_em_aberto(r.id);
  END LOOP;
END;
$$;