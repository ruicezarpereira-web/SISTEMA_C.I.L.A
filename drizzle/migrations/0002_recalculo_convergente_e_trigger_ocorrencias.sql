CREATE OR REPLACE FUNCTION public.recalcular_quinquenio(_quinquenio_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
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
      AND o.data_inicio <= nova_fim
      AND o.data_fim >= q.data_inicio;

    EXIT WHEN soma_nova = soma AND nova_fim = q.data_fim_base + soma_nova;

    soma := soma_nova;
    nova_fim := q.data_fim_base + soma_nova;
  END LOOP;

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

CREATE OR REPLACE FUNCTION public.trigger_recalcular_quinquenios_do_servidor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  sid uuid;
  q RECORD;
BEGIN
  sid := COALESCE(NEW.servidor_id, OLD.servidor_id);

  FOR q IN
    SELECT id FROM public.quinquenios
    WHERE servidor_id = sid
      AND status NOT IN ('DEFERIDO','INDEFERIDO','RETIFICADO')
  LOOP
    PERFORM public.recalcular_quinquenio(q.id);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS ocorrencias_recalcula_quinquenios ON public.ocorrencias;
CREATE TRIGGER ocorrencias_recalcula_quinquenios
AFTER INSERT OR UPDATE OR DELETE ON public.ocorrencias
FOR EACH ROW EXECUTE FUNCTION public.trigger_recalcular_quinquenios_do_servidor();