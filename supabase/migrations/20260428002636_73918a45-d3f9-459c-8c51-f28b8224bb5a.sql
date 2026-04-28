-- Create appointments table for booking wash appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT,
  shop_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  car_type TEXT,
  car_plate TEXT,
  services TEXT[] NOT NULL DEFAULT '{}',
  total_price NUMERIC NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_shop_scheduled ON public.appointments(shop_id, scheduled_at);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_member_select" ON public.appointments
  FOR SELECT TO authenticated USING (is_shop_member(shop_id));

CREATE POLICY "appointments_member_insert" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "appointments_member_update" ON public.appointments
  FOR UPDATE TO authenticated USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

CREATE POLICY "appointments_member_delete" ON public.appointments
  FOR DELETE TO authenticated USING (is_shop_member(shop_id));

CREATE POLICY "appointments_owner_all" ON public.appointments
  FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

CREATE POLICY "appointments_select_own_customer" ON public.appointments
  FOR SELECT TO authenticated USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

-- Reference generator A######
CREATE OR REPLACE FUNCTION public.generate_appointment_reference()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE new_ref TEXT; exists_count INT;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' THEN RETURN NEW; END IF;
  LOOP
    new_ref := 'A' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.appointments WHERE reference = new_ref;
    IF exists_count = 0 THEN NEW.reference := new_ref; EXIT; END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_appointments_reference
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_appointment_reference();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;