CREATE OR REPLACE FUNCTION public.recalcular_cadeia_servidor(_servidor_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  q public.quinquenios;
  ancora_fim DATE := NULL;
  fim_atual DATE;
  status_atual TEXT;
  primeiro_em_aquisicao INTEGER := NULL;
BEGIN
  FOR q IN
    SELECT * FROM public.quinquenios
    WHERE servidor_id = _servidor_id
    ORDER BY numero
  LOOP
    IF q.status IN ('DEFERIDO','INDEFERIDO','RETIFICADO') THEN
      ancora_fim := CASE WHEN q.status = 'DEFERIDO' THEN q.data_fim_ajustada ELSE NULL END;
      CONTINUE;
    END IF;

    IF ancora_fim IS NOT NULL AND q.data_inicio <> ancora_fim + 1 THEN
      UPDATE public.quinquenios
      SET data_inicio = ancora_fim + 1,
          data_fim_base = ancora_fim + 1 + 1824,
          data_fim_ajustada = ancora_fim + 1 + 1824
      WHERE id = q.id;
    END IF;

    PERFORM public.recalcular_quinquenio(q.id);

    SELECT data_fim_ajustada, status INTO fim_atual, status_atual
    FROM public.quinquenios WHERE id = q.id;

    IF status_atual = 'EM_AQUISICAO' AND primeiro_em_aquisicao IS NULL THEN
      primeiro_em_aquisicao := q.numero;
    END IF;

    ancora_fim := fim_atual;
  END LOOP;

  IF primeiro_em_aquisicao IS NOT NULL THEN
    DELETE FROM public.quinquenios qq
    WHERE qq.servidor_id = _servidor_id
      AND qq.numero > primeiro_em_aquisicao
      AND qq.status NOT IN ('DEFERIDO','INDEFERIDO','RETIFICADO')
      AND qq.processo_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.gozos g WHERE g.quinquenio_id = qq.id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalcular_quinquenios_do_servidor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  sid uuid;
BEGIN
  sid := COALESCE(NEW.servidor_id, OLD.servidor_id);
  PERFORM public.recalcular_cadeia_servidor(sid);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_situacao_quinquenios()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.servidores LOOP
    PERFORM public.recalcular_cadeia_servidor(r.id);
  END LOOP;
  FOR r IN SELECT id FROM public.servidores LOOP
    PERFORM public.garantir_quinquenios_em_aberto(r.id);
  END LOOP;
END;
$$;

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
    VALUES (NEW.servidor_id, NEW.numero + 1, novo_inicio, novo_inicio + 1824, novo_inicio + 1824, 'EM_AQUISICAO')
    ON CONFLICT (servidor_id, numero) DO NOTHING;
    PERFORM public.recalcular_cadeia_servidor(NEW.servidor_id);
  END IF;
  RETURN NEW;
END;
$$;