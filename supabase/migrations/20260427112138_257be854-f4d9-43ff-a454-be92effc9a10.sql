
-- 1) services.updated_at + auto-touch trigger
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Performance indexes for shop-scoped service listing
CREATE INDEX IF NOT EXISTS services_shop_active_idx     ON public.services (shop_id, is_active);
CREATE INDEX IF NOT EXISTS services_shop_category_idx   ON public.services (shop_id, category);
CREATE INDEX IF NOT EXISTS services_shop_updated_at_idx ON public.services (shop_id, updated_at DESC);

-- 3) Hard cap: 60 active services per shop
CREATE OR REPLACE FUNCTION public.enforce_service_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count int;
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_owner() THEN
    RETURN NEW;
  END IF;

  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
    FROM public.services
   WHERE shop_id = NEW.shop_id
     AND is_active = true
     AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF current_count >= 60 THEN
    RAISE EXCEPTION 'تم بلوغ الحد الأقصى للخدمات (60) لكل متجر. يرجى تعطيل خدمة قديمة قبل إضافة جديدة.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS services_enforce_limit ON public.services;
CREATE TRIGGER services_enforce_limit
  BEFORE INSERT OR UPDATE OF is_active, shop_id ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.enforce_service_limit();

-- 4) Extended owner action logger (additive — keeps original log_owner_action intact)
CREATE OR REPLACE FUNCTION public.log_owner_action_v2(
  _action text,
  _target_type text,
  _target_id text,
  _old_value jsonb DEFAULT NULL,
  _new_value jsonb DEFAULT NULL,
  _metadata  jsonb DEFAULT NULL,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can log owner actions';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    actor_user_id, actor_email, action, target_type, target_id,
    old_value, new_value, metadata, ip_address, user_agent
  )
  VALUES (
    auth.uid(), v_email, _action, _target_type, _target_id,
    _old_value, _new_value, _metadata, _ip, _user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.log_owner_action_v2(text,text,text,jsonb,jsonb,jsonb,text,text) TO authenticated;
