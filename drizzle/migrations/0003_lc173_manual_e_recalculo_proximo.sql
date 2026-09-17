-- Rodada 1.2b: registra como migration as correções da rodada 1.2, que até
-- agora só existiam no banco ao vivo (aplicadas por SQL direto) e não no
-- histórico de migrations em drizzle/migrations/.

-- 1. recalcular_quinquenio: parar de sobrescrever afetado_lc_173_2020
--    automaticamente. A LC 173/2020 não está mais em vigor; o campo agora
--    só é alterado manualmente (fluxo de retificação futuro), nunca pelo
--    recálculo.
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
      -- afetado_lc_173_2020 NÃO é mais tocado aqui — permanece com o valor
      -- que já estava gravado (default false, ou o que uma retificação
      -- manual tiver definido).
      afetado_lc_173_2020 = q.afetado_lc_173_2020,
      status = CASE
        WHEN status IN ('DEFERIDO','INDEFERIDO','RETIFICADO') THEN status
        WHEN nova_fim <= CURRENT_DATE THEN 'ADQUIRIDO_SUGERIDO'
        ELSE 'EM_AQUISICAO'
      END
  WHERE id = _quinquenio_id;
END;
$$;

-- 2. gerar_proximo_quinquenio: recalcular a linha recém-criada imediatamente,
--    para que cadeias de deferimento (vários quinquênios seguidos no mesmo
--    processo) já nasçam com o cálculo correto.
CREATE OR REPLACE FUNCTION public.gerar_proximo_quinquenio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  novo_inicio DATE;
  novo_id uuid;
BEGIN
  IF NEW.status = 'DEFERIDO' AND COALESCE(OLD.status, '') <> 'DEFERIDO' THEN
    novo_inicio := NEW.data_fim_ajustada + 1;

    INSERT INTO public.quinquenios (servidor_id, numero, data_inicio, data_fim_base, data_fim_ajustada, status)
    VALUES (NEW.servidor_id, NEW.numero + 1, novo_inicio, novo_inicio + 1825, novo_inicio + 1825, 'EM_AQUISICAO')
    ON CONFLICT (servidor_id, numero) DO NOTHING
    RETURNING id INTO novo_id;

    IF novo_id IS NOT NULL THEN
      PERFORM public.recalcular_quinquenio(novo_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
