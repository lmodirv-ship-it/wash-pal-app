-- 1) Add new columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS start_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expected_end_at timestamptz;

-- 2) Backfill start_at from created_at for existing rows
UPDATE public.orders SET start_at = created_at WHERE start_at IS NULL OR start_at = created_at;

-- 3) Drop old reference trigger (uses 6-digit format) on orders if present
DROP TRIGGER IF EXISTS set_order_reference ON public.orders;
DROP TRIGGER IF EXISTS generate_order_ref ON public.orders;
DROP TRIGGER IF EXISTS orders_generate_reference ON public.orders;

-- 4) New reference generator: 1 letter + 6 digits, e.g. S483920
CREATE OR REPLACE FUNCTION public.generate_order_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_ref text;
  exists_count int;
BEGIN
  IF NEW.reference IS NOT NULL AND NEW.reference <> '' AND NEW.reference ~ '^[A-Z][0-9]{6}$' THEN
    RETURN NEW;
  END IF;
  LOOP
    new_ref := 'S' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.orders WHERE reference = new_ref;
    IF exists_count = 0 THEN
      NEW.reference := new_ref;
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_generate_reference
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.generate_order_reference();

-- 5) Backfill missing/invalid references for existing rows
DO $$
DECLARE
  r record;
  new_ref text;
  exists_count int;
BEGIN
  FOR r IN SELECT id FROM public.orders WHERE reference IS NULL OR reference !~ '^[A-Z][0-9]{6}$' LOOP
    LOOP
      new_ref := 'S' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
      SELECT COUNT(*) INTO exists_count FROM public.orders WHERE reference = new_ref;
      EXIT WHEN exists_count = 0;
    END LOOP;
    UPDATE public.orders SET reference = new_ref WHERE id = r.id;
  END LOOP;
END $$;

-- 6) Add CHECK constraint on reference format (only when set)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_reference_format;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_reference_format CHECK (reference IS NULL OR reference ~ '^[A-Z][0-9]{6}$');

-- 7) Compute expected_end_at from first service's duration
CREATE OR REPLACE FUNCTION public.set_order_expected_end()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration int;
  v_first_service_id text;
BEGIN
  IF NEW.expected_end_at IS NULL AND NEW.services IS NOT NULL AND array_length(NEW.services, 1) > 0 THEN
    v_first_service_id := NEW.services[1];
    BEGIN
      SELECT duration INTO v_duration FROM public.services WHERE id = v_first_service_id::uuid LIMIT 1;
    EXCEPTION WHEN others THEN
      v_duration := NULL;
    END;
    IF v_duration IS NOT NULL AND v_duration > 0 THEN
      NEW.expected_end_at := NEW.start_at + (v_duration || ' minutes')::interval;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_expected_end ON public.orders;
CREATE TRIGGER orders_set_expected_end
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_expected_end();

-- 8) Auto-manage completed_at on status transitions
CREATE OR REPLACE FUNCTION public.sync_order_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
      NEW.completed_at := COALESCE(NEW.completed_at, now());
    ELSIF NEW.status <> 'completed' AND OLD.status = 'completed' THEN
      NEW.completed_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_sync_completed_at ON public.orders;
CREATE TRIGGER orders_sync_completed_at
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_completed_at();

-- 9) Indexes
CREATE INDEX IF NOT EXISTS idx_orders_shop_created ON public.orders (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_reference_unique ON public.orders (reference) WHERE reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_start_at ON public.orders (start_at DESC);