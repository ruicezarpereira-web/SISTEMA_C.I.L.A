-- 1. RU como chave de negócio em servidores
UPDATE public.servidores SET registro_unico = matricula WHERE registro_unico IS NULL OR btrim(registro_unico) = '';
ALTER TABLE public.servidores ALTER COLUMN registro_unico SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS servidores_registro_unico_key ON public.servidores (registro_unico);

-- 2. Histórico de matrículas
CREATE TABLE public.matriculas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  matricula TEXT NOT NULL,
  vigente_de DATE,
  vigente_ate DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX matriculas_historico_servidor_idx ON public.matriculas_historico (servidor_id);
CREATE INDEX matriculas_historico_matricula_idx ON public.matriculas_historico (matricula);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matriculas_historico TO authenticated;
GRANT ALL ON public.matriculas_historico TO service_role;
ALTER TABLE public.matriculas_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users with role can view matriculas_historico" ON public.matriculas_historico FOR SELECT TO authenticated USING (public.has_any_role());
CREATE POLICY "Admins can insert matriculas_historico" ON public.matriculas_historico FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update matriculas_historico" ON public.matriculas_historico FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete matriculas_historico" ON public.matriculas_historico FOR DELETE TO authenticated USING (public.is_admin());

-- semeia histórico com a matrícula atual
INSERT INTO public.matriculas_historico (servidor_id, matricula, vigente_de)
SELECT id, matricula, data_admissao FROM public.servidores;

-- 3. Quinquênios persistentes
CREATE TABLE public.quinquenios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim_base DATE NOT NULL,
  dias_acrescimo INTEGER NOT NULL DEFAULT 0,
  data_fim_ajustada DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'EM_AQUISICAO',
  processo_id UUID REFERENCES public.processos(id) ON DELETE SET NULL,
  retifica_quinquenio_id UUID REFERENCES public.quinquenios(id) ON DELETE SET NULL,
  afetado_lc_173_2020 BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quinquenios_status_check CHECK (status IN ('EM_AQUISICAO','ADQUIRIDO_SUGERIDO','DEFERIDO','INDEFERIDO','RETIFICADO')),
  CONSTRAINT quinquenios_numero_check CHECK (numero >= 1),
  CONSTRAINT quinquenios_servidor_numero_key UNIQUE (servidor_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quinquenios TO authenticated;
GRANT ALL ON public.quinquenios TO service_role;
ALTER TABLE public.quinquenios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users with role can view quinquenios" ON public.quinquenios FOR SELECT TO authenticated USING (public.has_any_role());
CREATE POLICY "Users with role can insert quinquenios" ON public.quinquenios FOR INSERT TO authenticated WITH CHECK (public.has_any_role());
CREATE POLICY "Users with role can update quinquenios" ON public.quinquenios FOR UPDATE TO authenticated USING (public.has_any_role());
CREATE POLICY "Admins can delete quinquenios" ON public.quinquenios FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER update_quinquenios_updated_at BEFORE UPDATE ON public.quinquenios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Ocorrências unificadas
CREATE TABLE public.ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_acrescimo INTEGER NOT NULL DEFAULT 0,
  documento_referencia TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ocorrencias_tipo_check CHECK (tipo IN ('FALTA_INJUSTIFICADA','SUSPENSAO','ATESTADO','FALTA_JUSTIFICADA','AFASTAMENTO_REMUNERADO','LICENCA_SEM_VENCIMENTO','LICENCA_SEM_ONUS','MANDATO_ELETIVO_NAO_REMUNERADO'))
);
CREATE INDEX ocorrencias_servidor_idx ON public.ocorrencias (servidor_id);
CREATE INDEX ocorrencias_periodo_idx ON public.ocorrencias (data_inicio, data_fim);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ocorrencias TO authenticated;
GRANT ALL ON public.ocorrencias TO service_role;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users with role can view ocorrencias" ON public.ocorrencias FOR SELECT TO authenticated USING (public.has_any_role());
CREATE POLICY "Admins can insert ocorrencias" ON public.ocorrencias FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update ocorrencias" ON public.ocorrencias FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete ocorrencias" ON public.ocorrencias FOR DELETE TO authenticated USING (public.is_admin());

-- dias_acrescimo derivado do tipo (nunca editável manualmente)
CREATE OR REPLACE FUNCTION public.set_ocorrencia_dias_acrescimo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.dias_acrescimo := CASE NEW.tipo
    WHEN 'FALTA_INJUSTIFICADA' THEN 10
    WHEN 'SUSPENSAO' THEN 10
    ELSE 1
  END;
  RETURN NEW;
END;
$$;
CREATE TRIGGER ocorrencias_set_dias_acrescimo
BEFORE INSERT OR UPDATE ON public.ocorrencias
FOR EACH ROW EXECUTE FUNCTION public.set_ocorrencia_dias_acrescimo();

-- 5. Gozos (90 dias por quinquênio, até 3 períodos)
CREATE TABLE public.gozos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quinquenio_id UUID NOT NULL REFERENCES public.quinquenios(id) ON DELETE CASCADE,
  numero_periodo INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gozos_numero_periodo_check CHECK (numero_periodo BETWEEN 1 AND 3),
  CONSTRAINT gozos_dias_check CHECK (dias > 0 AND dias <= 90),
  CONSTRAINT gozos_quinquenio_periodo_key UNIQUE (quinquenio_id, numero_periodo)
);
CREATE INDEX gozos_quinquenio_idx ON public.gozos (quinquenio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gozos TO authenticated;
GRANT ALL ON public.gozos TO service_role;
ALTER TABLE public.gozos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users with role can view gozos" ON public.gozos FOR SELECT TO authenticated USING (public.has_any_role());
CREATE POLICY "Users with role can insert gozos" ON public.gozos FOR INSERT TO authenticated WITH CHECK (public.has_any_role());
CREATE POLICY "Users with role can update gozos" ON public.gozos FOR UPDATE TO authenticated USING (public.has_any_role());
CREATE POLICY "Admins can delete gozos" ON public.gozos FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.check_gozo_saldo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(dias), 0) INTO total
  FROM public.gozos
  WHERE quinquenio_id = NEW.quinquenio_id
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF total + NEW.dias > 90 THEN
    RAISE EXCEPTION 'Saldo de licença-prêmio excedido: % dias já gozados, tentativa de mais % (máximo 90).', total, NEW.dias;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER gozos_check_saldo
BEFORE INSERT OR UPDATE ON public.gozos
FOR EACH ROW EXECUTE FUNCTION public.check_gozo_saldo();

-- 6. Motor de cálculo no banco: recalcula acréscimos e status sugerido
CREATE OR REPLACE FUNCTION public.recalcular_quinquenio(_quinquenio_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  q public.quinquenios;
  soma INTEGER;
  nova_fim DATE;
BEGIN
  SELECT * INTO q FROM public.quinquenios WHERE id = _quinquenio_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COALESCE(SUM(o.dias_acrescimo), 0) INTO soma
  FROM public.ocorrencias o
  WHERE o.servidor_id = q.servidor_id
    AND o.data_inicio <= q.data_fim_base + soma_placeholder(0)
    AND o.data_fim >= q.data_inicio;

  nova_fim := q.data_fim_base + soma;

  UPDATE public.quinquenios
  SET dias_acrescimo = soma,
      data_fim_ajustada = nova_fim,
      afetado_lc_173_2020 = (q.data_inicio <= DATE '2021-12-31' AND nova_fim >= DATE '2020-05-28'),
      status = CASE
        WHEN status IN ('DEFERIDO','INDEFERIDO','RETIFICADO') THEN status
        WHEN nova_fim <= CURRENT_DATE THEN 'ADQUIRIDO_SUGERIDO'
        ELSE 'EM_AQUISICAO'
      END
  WHERE id = _quinquenio_id;
END;
$$;

-- 7. Ao deferir, gera o próximo quinquênio automaticamente
CREATE OR REPLACE FUNCTION public.gerar_proximo_quinquenio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  novo_inicio DATE;
BEGIN
  IF NEW.status = 'DEFERIDO' AND COALESCE(OLD.status, '') <> 'DEFERIDO' THEN
    novo_inicio := NEW.data_fim_ajustada + 1;
    INSERT INTO public.quinquenios (servidor_id, numero, data_inicio, data_fim_base, data_fim_ajustada, status)
    VALUES (NEW.servidor_id, NEW.numero + 1, novo_inicio, novo_inicio + 1825, novo_inicio + 1825, 'EM_AQUISICAO')
    ON CONFLICT (servidor_id, numero) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER quinquenios_gerar_proximo
AFTER UPDATE OF status ON public.quinquenios
FOR EACH ROW EXECUTE FUNCTION public.gerar_proximo_quinquenio();