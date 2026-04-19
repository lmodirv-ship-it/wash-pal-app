
ALTER TABLE public.b2b_partners
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

CREATE OR REPLACE FUNCTION public.generate_b2b_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  new_ref TEXT;
  exists_count INTEGER;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN
    RETURN NEW;
  END IF;
  LOOP
    new_ref := 'B-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.b2b_partners WHERE reference = new_ref;
    IF exists_count = 0 THEN
      NEW.reference := new_ref;
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_b2b_partners_reference ON public.b2b_partners;
CREATE TRIGGER trg_b2b_partners_reference
BEFORE INSERT ON public.b2b_partners
FOR EACH ROW
EXECUTE FUNCTION public.generate_b2b_reference();
