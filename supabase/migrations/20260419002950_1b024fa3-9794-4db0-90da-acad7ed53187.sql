-- 1. Add reference column
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE;

-- 2. Function to generate reference: letter + 6 digits (e.g., S-123456)
CREATE OR REPLACE FUNCTION public.generate_service_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_ref TEXT;
  exists_count INTEGER;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN
    RETURN NEW;
  END IF;
  LOOP
    new_ref := 'S-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.services WHERE reference = new_ref;
    IF exists_count = 0 THEN
      NEW.reference := new_ref;
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- 3. Trigger
DROP TRIGGER IF EXISTS set_service_reference ON public.services;
CREATE TRIGGER set_service_reference
BEFORE INSERT ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.generate_service_reference();

-- 4. Backfill existing services that don't have a reference
DO $$
DECLARE
  rec RECORD;
  new_ref TEXT;
  exists_count INTEGER;
BEGIN
  FOR rec IN SELECT id FROM public.services WHERE reference IS NULL OR reference = '' LOOP
    LOOP
      new_ref := 'S-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
      SELECT COUNT(*) INTO exists_count FROM public.services WHERE reference = new_ref;
      EXIT WHEN exists_count = 0;
    END LOOP;
    UPDATE public.services SET reference = new_ref WHERE id = rec.id;
  END LOOP;
END $$;