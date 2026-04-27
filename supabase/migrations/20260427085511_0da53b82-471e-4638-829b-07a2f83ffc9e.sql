
-- ============================================================
-- PHASE 1: SECURITY HARDENING — Critical fixes only
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) FIX MISSING WITH CHECK on member UPDATE policies
--    Without WITH CHECK, members could change shop_id to a shop
--    they own, effectively "stealing" data.
-- ─────────────────────────────────────────────────────────────

-- ORDERS
DROP POLICY IF EXISTS orders_member_all ON public.orders;
CREATE POLICY orders_member_select ON public.orders FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));
CREATE POLICY orders_member_insert ON public.orders FOR INSERT TO authenticated
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY orders_member_update ON public.orders FOR UPDATE TO authenticated
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY orders_member_delete ON public.orders FOR DELETE TO authenticated
  USING (is_shop_member(shop_id));

-- INVOICES
DROP POLICY IF EXISTS invoices_member_all ON public.invoices;
CREATE POLICY invoices_member_select ON public.invoices FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));
CREATE POLICY invoices_member_insert ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY invoices_member_update ON public.invoices FOR UPDATE TO authenticated
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY invoices_member_delete ON public.invoices FOR DELETE TO authenticated
  USING (is_shop_member(shop_id));

-- CUSTOMERS
DROP POLICY IF EXISTS customers_member_all ON public.customers;
CREATE POLICY customers_member_select ON public.customers FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));
CREATE POLICY customers_member_insert ON public.customers FOR INSERT TO authenticated
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY customers_member_update ON public.customers FOR UPDATE TO authenticated
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY customers_member_delete ON public.customers FOR DELETE TO authenticated
  USING (is_shop_member(shop_id));

-- EMPLOYEES
DROP POLICY IF EXISTS employees_member_all ON public.employees;
CREATE POLICY employees_member_select ON public.employees FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));
CREATE POLICY employees_member_insert ON public.employees FOR INSERT TO authenticated
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY employees_member_update ON public.employees FOR UPDATE TO authenticated
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY employees_member_delete ON public.employees FOR DELETE TO authenticated
  USING (is_shop_member(shop_id));

-- BRANCHES
DROP POLICY IF EXISTS branches_member_all ON public.branches;
CREATE POLICY branches_member_select ON public.branches FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));
CREATE POLICY branches_member_insert ON public.branches FOR INSERT TO authenticated
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY branches_member_update ON public.branches FOR UPDATE TO authenticated
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY branches_member_delete ON public.branches FOR DELETE TO authenticated
  USING (is_shop_member(shop_id));

-- EXPENSES
DROP POLICY IF EXISTS expenses_member_all ON public.expenses;
CREATE POLICY expenses_member_select ON public.expenses FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));
CREATE POLICY expenses_member_insert ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY expenses_member_update ON public.expenses FOR UPDATE TO authenticated
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY expenses_member_delete ON public.expenses FOR DELETE TO authenticated
  USING (is_shop_member(shop_id));

-- DISCOUNT COUPONS
DROP POLICY IF EXISTS coupons_member_all ON public.discount_coupons;
CREATE POLICY coupons_member_select ON public.discount_coupons FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));
CREATE POLICY coupons_member_insert ON public.discount_coupons FOR INSERT TO authenticated
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY coupons_member_update ON public.discount_coupons FOR UPDATE TO authenticated
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY coupons_member_delete ON public.discount_coupons FOR DELETE TO authenticated
  USING (is_shop_member(shop_id));

-- MESSAGE TEMPLATES
DROP POLICY IF EXISTS templates_member_all ON public.message_templates;
CREATE POLICY templates_member_select ON public.message_templates FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));
CREATE POLICY templates_member_insert ON public.message_templates FOR INSERT TO authenticated
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY templates_member_update ON public.message_templates FOR UPDATE TO authenticated
  USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));
CREATE POLICY templates_member_delete ON public.message_templates FOR DELETE TO authenticated
  USING (is_shop_member(shop_id));

-- ─────────────────────────────────────────────────────────────
-- 2) B2B PARTNERS — add shop isolation
--    Currently any manager can see ALL b2b_partners. Fix by
--    enforcing shop_id scoping (admin still sees everything).
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS b2b_partners_select_admin_manager ON public.b2b_partners;
DROP POLICY IF EXISTS b2b_partners_insert_admin_manager ON public.b2b_partners;
DROP POLICY IF EXISTS b2b_partners_update_admin_manager ON public.b2b_partners;
DROP POLICY IF EXISTS b2b_partners_delete_admin ON public.b2b_partners;

CREATE POLICY b2b_partners_admin_all ON public.b2b_partners FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY b2b_partners_member_select ON public.b2b_partners FOR SELECT TO authenticated
  USING (shop_id IS NOT NULL AND is_shop_member(shop_id));

CREATE POLICY b2b_partners_manager_insert ON public.b2b_partners FOR INSERT TO authenticated
  WITH CHECK (shop_id IS NOT NULL AND is_shop_manager(shop_id));

CREATE POLICY b2b_partners_manager_update ON public.b2b_partners FOR UPDATE TO authenticated
  USING (shop_id IS NOT NULL AND is_shop_manager(shop_id))
  WITH CHECK (shop_id IS NOT NULL AND is_shop_manager(shop_id));

CREATE POLICY b2b_partners_manager_delete ON public.b2b_partners FOR DELETE TO authenticated
  USING (shop_id IS NOT NULL AND is_shop_manager(shop_id));

-- ─────────────────────────────────────────────────────────────
-- 3) ROLE AUDIT LOG — track every role change
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.role_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  changed_by uuid,
  source_table text NOT NULL,           -- 'user_roles' | 'profiles'
  old_role text,
  new_role text,
  action text NOT NULL,                 -- 'INSERT' | 'UPDATE' | 'DELETE'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_audit_logs_admin_select ON public.role_audit_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policies → only triggers (SECURITY DEFINER) can write.

CREATE INDEX IF NOT EXISTS idx_role_audit_target ON public.role_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_created ON public.role_audit_logs(created_at DESC);

-- Trigger function for user_roles
CREATE OR REPLACE FUNCTION public.log_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_logs (target_user_id, changed_by, source_table, old_role, new_role, action)
    VALUES (NEW.user_id, auth.uid(), 'user_roles', NULL, NEW.role::text, 'INSERT');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      INSERT INTO public.role_audit_logs (target_user_id, changed_by, source_table, old_role, new_role, action)
      VALUES (NEW.user_id, auth.uid(), 'user_roles', OLD.role::text, NEW.role::text, 'UPDATE');
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_logs (target_user_id, changed_by, source_table, old_role, new_role, action)
    VALUES (OLD.user_id, auth.uid(), 'user_roles', OLD.role::text, NULL, 'DELETE');
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_log_user_roles ON public.user_roles;
CREATE TRIGGER trg_log_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_user_roles_changes();

-- Trigger function for profiles.role
CREATE OR REPLACE FUNCTION public.log_profile_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO public.role_audit_logs (target_user_id, changed_by, source_table, old_role, new_role, action)
    VALUES (NEW.user_id, auth.uid(), 'profiles', OLD.role, NEW.role, 'UPDATE');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_profile_role ON public.profiles;
CREATE TRIGGER trg_log_profile_role
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_role_changes();

-- ─────────────────────────────────────────────────────────────
-- 4) SYNC profiles.role ← user_roles (cache pattern)
--    user_roles is the source of truth. profiles.role is a
--    convenient cache used by some UI; keep it in sync.
--    Highest role wins (admin > supervisor > manager > employee > customer).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_uid uuid;
  highest text;
BEGIN
  target_uid := COALESCE(NEW.user_id, OLD.user_id);

  SELECT role::text INTO highest
  FROM public.user_roles
  WHERE user_id = target_uid
  ORDER BY CASE role::text
    WHEN 'admin' THEN 1
    WHEN 'supervisor' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
    WHEN 'customer' THEN 5
    ELSE 99
  END
  LIMIT 1;

  IF highest IS NULL THEN
    highest := 'employee';
  END IF;

  UPDATE public.profiles SET role = highest
  WHERE user_id = target_uid AND role IS DISTINCT FROM highest;

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_from_user_roles();

-- ─────────────────────────────────────────────────────────────
-- 5) Backfill: ensure existing profiles.role matches user_roles
-- ─────────────────────────────────────────────────────────────

UPDATE public.profiles p
SET role = sub.highest
FROM (
  SELECT user_id,
    (SELECT role::text FROM public.user_roles ur
      WHERE ur.user_id = u.user_id
      ORDER BY CASE role::text
        WHEN 'admin' THEN 1 WHEN 'supervisor' THEN 2
        WHEN 'manager' THEN 3 WHEN 'employee' THEN 4
        WHEN 'customer' THEN 5 ELSE 99 END
      LIMIT 1) AS highest
  FROM (SELECT DISTINCT user_id FROM public.user_roles) u
) sub
WHERE p.user_id = sub.user_id
  AND sub.highest IS NOT NULL
  AND p.role IS DISTINCT FROM sub.highest;
