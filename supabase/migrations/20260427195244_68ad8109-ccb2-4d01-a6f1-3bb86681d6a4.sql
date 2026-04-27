-- Add reference column + auto-generation trigger to remaining tables

ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS reference text;
CREATE UNIQUE INDEX IF NOT EXISTS message_templates_reference_key ON public.message_templates(reference) WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_message_template_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'MT-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.message_templates WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_message_templates_reference ON public.message_templates;
CREATE TRIGGER trg_message_templates_reference BEFORE INSERT ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.generate_message_template_reference();

UPDATE public.message_templates SET reference = 'MT-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  WHERE reference IS NULL OR reference = '';

ALTER TABLE public.discount_coupons ADD COLUMN IF NOT EXISTS reference text;
CREATE UNIQUE INDEX IF NOT EXISTS discount_coupons_reference_key ON public.discount_coupons(reference) WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_coupon_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'CP-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.discount_coupons WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_discount_coupons_reference ON public.discount_coupons;
CREATE TRIGGER trg_discount_coupons_reference BEFORE INSERT ON public.discount_coupons
  FOR EACH ROW EXECUTE FUNCTION public.generate_coupon_reference();

UPDATE public.discount_coupons SET reference = 'CP-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  WHERE reference IS NULL OR reference = '';

ALTER TABLE public.imou_devices ADD COLUMN IF NOT EXISTS reference text;
CREATE UNIQUE INDEX IF NOT EXISTS imou_devices_reference_key ON public.imou_devices(reference) WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_imou_device_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'CAM-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.imou_devices WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_imou_devices_reference ON public.imou_devices;
CREATE TRIGGER trg_imou_devices_reference BEFORE INSERT ON public.imou_devices
  FOR EACH ROW EXECUTE FUNCTION public.generate_imou_device_reference();

UPDATE public.imou_devices SET reference = 'CAM-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  WHERE reference IS NULL OR reference = '';