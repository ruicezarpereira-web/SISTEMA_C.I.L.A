-- Rodada 2: suporte ao importador real da planilha (idempotência + legado)

-- 1. Chaves naturais para upsert idempotente
CREATE UNIQUE INDEX IF NOT EXISTS gozos_quinquenio_periodo_key
  ON public.gozos (quinquenio_id, numero_periodo);

CREATE UNIQUE INDEX IF NOT EXISTS matriculas_historico_servidor_matricula_key
  ON public.matriculas_historico (servidor_id, matricula);

CREATE UNIQUE INDEX IF NOT EXISTS processos_numero_processo_key
  ON public.processos (numero_processo);

CREATE UNIQUE INDEX IF NOT EXISTS ocorrencias_chave_natural_key
  ON public.ocorrencias (servidor_id, tipo, data_inicio, data_fim, quantidade_dias);

-- 2. Coluna DATA FINAL da aba de processos
ALTER TABLE public.processos ADD COLUMN IF NOT EXISTS data_final DATE;

-- 3. Faltas históricas sem quantidade de dias confiável e estornos
CREATE TABLE IF NOT EXISTS public.faltas_historico_legado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id uuid REFERENCES public.servidores(id) ON DELETE CASCADE,
  evento TEXT,
  tipo_evento TEXT,
  competencia TEXT,
  valor NUMERIC,
  referencia TEXT,
  situacao TEXT,
  precisa_revisao BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS faltas_historico_legado_chave_natural_key
  ON public.faltas_historico_legado (servidor_id, evento, competencia, valor);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faltas_historico_legado TO authenticated;
GRANT ALL ON public.faltas_historico_legado TO service_role;

ALTER TABLE public.faltas_historico_legado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users with role can view faltas_historico_legado" ON public.faltas_historico_legado;
CREATE POLICY "Users with role can view faltas_historico_legado"
  ON public.faltas_historico_legado FOR SELECT TO authenticated
  USING (public.has_any_role());

DROP POLICY IF EXISTS "Users with role can insert faltas_historico_legado" ON public.faltas_historico_legado;
CREATE POLICY "Users with role can insert faltas_historico_legado"
  ON public.faltas_historico_legado FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role());

DROP POLICY IF EXISTS "Users with role can update faltas_historico_legado" ON public.faltas_historico_legado;
CREATE POLICY "Users with role can update faltas_historico_legado"
  ON public.faltas_historico_legado FOR UPDATE TO authenticated
  USING (public.has_any_role());

DROP POLICY IF EXISTS "Admins can delete faltas_historico_legado" ON public.faltas_historico_legado;
CREATE POLICY "Admins can delete faltas_historico_legado"
  ON public.faltas_historico_legado FOR DELETE TO authenticated
  USING (public.is_admin());
