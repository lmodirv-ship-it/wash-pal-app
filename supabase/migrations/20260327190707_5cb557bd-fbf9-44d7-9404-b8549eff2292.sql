-- Add reference column to customers, employees, orders
ALTER TABLE public.customers ADD COLUMN reference TEXT UNIQUE;
ALTER TABLE public.employees ADD COLUMN reference TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN reference TEXT UNIQUE;

-- Add role column to track user type
ALTER TABLE public.customers ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE public.employees ADD COLUMN role_type TEXT NOT NULL DEFAULT 'employee';

-- Create shops table for B2B subscription management
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT UNIQUE,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  email TEXT,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  package_name TEXT NOT NULL DEFAULT 'basic',
  total_points INTEGER NOT NULL DEFAULT 100,
  used_points INTEGER NOT NULL DEFAULT 0,
  remaining_points INTEGER GENERATED ALWAYS AS (total_points - used_points) STORED,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to shops" ON public.shops FOR ALL USING (true) WITH CHECK (true);

-- Create function to auto-generate 6-digit reference
CREATE OR REPLACE FUNCTION public.generate_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_ref TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    new_ref := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    EXECUTE format('SELECT COUNT(*) FROM %I.%I WHERE reference = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
      INTO exists_count USING new_ref;
    IF exists_count = 0 THEN
      NEW.reference := new_ref;
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for auto reference generation
CREATE TRIGGER generate_customer_ref BEFORE INSERT ON public.customers
  FOR EACH ROW WHEN (NEW.reference IS NULL) EXECUTE FUNCTION public.generate_reference();

CREATE TRIGGER generate_employee_ref BEFORE INSERT ON public.employees
  FOR EACH ROW WHEN (NEW.reference IS NULL) EXECUTE FUNCTION public.generate_reference();

CREATE TRIGGER generate_order_ref BEFORE INSERT ON public.orders
  FOR EACH ROW WHEN (NEW.reference IS NULL) EXECUTE FUNCTION public.generate_reference();

CREATE TRIGGER generate_shop_ref BEFORE INSERT ON public.shops
  FOR EACH ROW WHEN (NEW.reference IS NULL) EXECUTE FUNCTION public.generate_reference();