
-- ============================================================
-- 1) REALTIME publication
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='invoices'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices';
  END IF;
END $$;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;

-- ============================================================
-- 2) SHOP LIMITS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_shop_limits(_shop_id uuid)
RETURNS TABLE(max_employees int, max_branches int, plan_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(pp.max_employees, 5) AS max_employees,
    COALESCE(pp.max_branches, 1)  AS max_branches,
    COALESCE(s.plan, 'starter')   AS plan_code
  FROM public.subscriptions s
  LEFT JOIN public.pricing_plans pp ON pp.code = s.plan
  WHERE s.shop_id = _shop_id
  LIMIT 1;
$$;

-- Trigger: enforce employee count
CREATE OR REPLACE FUNCTION public.enforce_employee_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_count int;
  max_allowed int;
BEGIN
  -- Admin bypass
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT max_employees INTO max_allowed FROM public.get_shop_limits(NEW.shop_id);
  IF max_allowed IS NULL THEN max_allowed := 5; END IF;

  SELECT COUNT(*) INTO current_count FROM public.employees
  WHERE shop_id = NEW.shop_id AND is_active = true;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'تم بلوغ الحد الأقصى للموظفين (%) في خطتك الحالية. يرجى ترقية الاشتراك.', max_allowed
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_employee_limit ON public.employees;
CREATE TRIGGER trg_enforce_employee_limit
BEFORE INSERT ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.enforce_employee_limit();

-- Trigger: enforce branch count
CREATE OR REPLACE FUNCTION public.enforce_branch_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_count int;
  max_allowed int;
BEGIN
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT max_branches INTO max_allowed FROM public.get_shop_limits(NEW.shop_id);
  IF max_allowed IS NULL THEN max_allowed := 1; END IF;

  SELECT COUNT(*) INTO current_count FROM public.branches
  WHERE shop_id = NEW.shop_id AND is_active = true;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'تم بلوغ الحد الأقصى للفروع (%) في خطتك الحالية. يرجى ترقية الاشتراك.', max_allowed
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_branch_limit ON public.branches;
CREATE TRIGGER trg_enforce_branch_limit
BEFORE INSERT ON public.branches
FOR EACH ROW EXECUTE FUNCTION public.enforce_branch_limit();

-- ============================================================
-- 3) AUTO NOTIFICATIONS
-- ============================================================
-- Notify shop owner on new order
CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  owner_uid uuid;
BEGIN
  SELECT owner_id INTO owner_uid FROM public.shops WHERE id = NEW.shop_id;
  IF owner_uid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, shop_id, type, title, message)
    VALUES (
      owner_uid, NEW.shop_id, 'order',
      'طلب جديد',
      'تم استلام طلب جديد من ' || COALESCE(NEW.customer_name, 'عميل') || ' (' || COALESCE(NEW.car_plate,'') || ')'
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_on_new_order ON public.orders;
CREATE TRIGGER trg_notify_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_order();

-- Notify on invite acceptance
CREATE OR REPLACE FUNCTION public.notify_on_invite_accept()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO public.notifications (user_id, shop_id, type, title, message)
    VALUES (
      NEW.invited_by, NEW.shop_id, 'invite',
      'تم قبول الدعوة',
      'قبل ' || NEW.email || ' الدعوة للانضمام كـ ' || NEW.role
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_on_invite_accept ON public.invites;
CREATE TRIGGER trg_notify_on_invite_accept
AFTER UPDATE ON public.invites
FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite_accept();

-- ============================================================
-- 4) TIGHTEN NOTIFICATIONS RLS
-- ============================================================
DROP POLICY IF EXISTS notifications_insert_member ON public.notifications;
CREATE POLICY notifications_insert_member
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR (
    auth.uid() = user_id
    AND (shop_id IS NULL OR is_shop_member(shop_id))
  )
);

-- ============================================================
-- 5) ENSURE ROLE ESCALATION GUARD
-- ============================================================
DROP TRIGGER IF EXISTS trg_prevent_role_escalation_profiles ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();
