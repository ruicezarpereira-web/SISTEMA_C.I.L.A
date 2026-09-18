-- Rodada 1.3: quantidade_dias em ocorrencias (falta de 3 dias = +30)
ALTER TABLE public.ocorrencias
  ADD COLUMN quantidade_dias INTEGER NOT NULL DEFAULT 1
  CHECK (quantidade_dias >= 1);

-- Acréscimo passa a multiplicar pela quantidade de dias do evento.
CREATE OR REPLACE FUNCTION public.set_ocorrencia_dias_acrescimo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base INTEGER;
BEGIN
  base := CASE NEW.tipo
    WHEN 'FALTA_INJUSTIFICADA' THEN 10
    WHEN 'SUSPENSAO' THEN 10
    ELSE 1
  END;
  NEW.dias_acrescimo := base * COALESCE(NEW.quantidade_dias, 1);
  RETURN NEW;
END;
$$;