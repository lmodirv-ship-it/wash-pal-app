-- Function to generate employee reference: E-XXXXXX
CREATE OR REPLACE FUNCTION public.generate_employee_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_ref TEXT;
  exists_count INTEGER;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN
    RETURN NEW;
  END IF;
  LOOP
    new_ref := 'E-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.employees WHERE reference = new_ref;
    IF exists_count = 0 THEN
      NEW.reference := new_ref;
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger on insert
DROP TRIGGER IF EXISTS set_employee_reference ON public.employees;
CREATE TRIGGER set_employee_reference
BEFORE INSERT ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.generate_employee_reference();

-- Backfill existing employees that don't follow E-###### format
DO $$
DECLARE
  emp RECORD;
  new_ref TEXT;
  exists_count INTEGER;
BEGIN
  FOR emp IN SELECT id FROM public.employees WHERE reference IS NULL OR reference !~ '^E-[0-9]{6}$' LOOP
    LOOP
      new_ref := 'E-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
      SELECT COUNT(*) INTO exists_count FROM public.employees WHERE reference = new_ref;
      EXIT WHEN exists_count = 0;
    END LOOP;
    UPDATE public.employees SET reference = new_ref WHERE id = emp.id;
  END LOOP;
END $$;