-- Add reference column + auto-generation trigger to branches and customers

ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS reference text;
CREATE UNIQUE INDEX IF NOT EXISTS branches_reference_key ON public.branches(reference) WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_branch_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'BR-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.branches WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_branches_reference ON public.branches;
CREATE TRIGGER trg_branches_reference BEFORE INSERT ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.generate_branch_reference();

UPDATE public.branches SET reference = 'BR-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  WHERE reference IS NULL OR reference = '';

CREATE UNIQUE INDEX IF NOT EXISTS customers_reference_key ON public.customers(reference) WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_customer_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'C-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.customers WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_customers_reference ON public.customers;
CREATE TRIGGER trg_customers_reference BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.generate_customer_reference();

UPDATE public.customers SET reference = 'C-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  WHERE reference IS NULL OR reference = '';