-- Add reference to invoices, expenses with auto-generation triggers

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reference text;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_reference_key ON public.invoices(reference) WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_invoice_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'I-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.invoices WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_invoices_reference ON public.invoices;
CREATE TRIGGER trg_invoices_reference BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_reference();

UPDATE public.invoices SET reference = 'I-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  WHERE reference IS NULL OR reference = '';

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS reference text;
CREATE UNIQUE INDEX IF NOT EXISTS expenses_reference_key ON public.expenses(reference) WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_expense_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'EX-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.expenses WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_expenses_reference ON public.expenses;
CREATE TRIGGER trg_expenses_reference BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.generate_expense_reference();

UPDATE public.expenses SET reference = 'EX-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  WHERE reference IS NULL OR reference = '';