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
    AND o.data_inicio <= q.data_fim_base
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