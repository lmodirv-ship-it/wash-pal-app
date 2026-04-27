
-- 1) تحديث دوال التوليد - بادئة حرفين بدون شرطة

CREATE OR REPLACE FUNCTION public.generate_employee_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'EM' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.employees WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_service_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'SR' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.services WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_customer_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'CU' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.customers WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_invoice_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'IN' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.invoices WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_branch_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'BR' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.branches WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_expense_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'EX' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.expenses WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_message_template_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'MT' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.message_templates WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_coupon_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'CP' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.discount_coupons WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_imou_device_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'CM' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.imou_devices WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_b2b_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'BP' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.b2b_partners WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_order_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref text; exists_count int;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' AND NEW.reference ~ '^[A-Z]{2}[0-9]{6}$' THEN
    RETURN NEW;
  END IF;
  LOOP
    new_ref := 'OR' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.orders WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.generate_shop_reference_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref text; exists_count int;
BEGIN
  IF NEW.reference_code IS NOT NULL AND NEW.reference_code <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'SH' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.shops WHERE reference_code = new_ref;
    IF exists_count = 0 THEN NEW.reference_code := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

-- 2) تحديث السجلات الموجودة: إزالة الشرطة وتحديث البادئات

UPDATE public.employees SET reference = 'EM' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.services SET reference = 'SR' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.customers SET reference = 'CU' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.invoices SET reference = 'IN' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.branches SET reference = 'BR' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.expenses SET reference = 'EX' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.message_templates SET reference = 'MT' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.discount_coupons SET reference = 'CP' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.imou_devices SET reference = 'CM' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.b2b_partners SET reference = 'BP' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.orders SET reference = 'OR' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0') WHERE reference IS NULL OR reference !~ '^[A-Z]{2}[0-9]{6}$';
UPDATE public.shops SET reference_code = 'SH' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0') WHERE reference_code IS NULL OR reference_code !~ '^[A-Z]{2}[0-9]{6}$';
