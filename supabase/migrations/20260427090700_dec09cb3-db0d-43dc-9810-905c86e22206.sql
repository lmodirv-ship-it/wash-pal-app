
-- ============================================================
-- 1) Promote master account to owner
-- ============================================================
DO $$
DECLARE
  master_uid uuid;
BEGIN
  SELECT id INTO master_uid FROM auth.users WHERE lower(email) = 'lmodirv@gmail.com' LIMIT 1;
  IF master_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (master_uid, 'owner'::public.app_role)
    ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET role = 'owner' WHERE user_id = master_uid;
  END IF;
END $$;

-- ============================================================
-- 2) is_owner() helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'::public.app_role
  );
$$;

-- ============================================================
-- 3) Update sync function — owner at the top
-- ============================================================
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
    WHEN 'owner' THEN 0
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

-- ============================================================
-- 4) Update self-escalation — only owner manages owner role
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    IF NEW.role = 'owner' OR OLD.role = 'owner' THEN
      IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Only platform owner can grant or remove owner role';
      END IF;
    END IF;

    IF NOT (public.is_owner() OR public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
      RAISE EXCEPTION 'Only owner or admin can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- ============================================================
-- 5) Block 'owner' from signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
  IF user_role NOT IN ('admin','manager','supervisor','employee','customer') THEN
    user_role := 'employee';
  END IF;

  INSERT INTO public.profiles (user_id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), user_role);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END $$;

-- ============================================================
-- 6) Owner-override RLS policies (additive — alongside admin)
-- ============================================================

CREATE POLICY orders_owner_all ON public.orders FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY invoices_owner_all ON public.invoices FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY customers_owner_all ON public.customers FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY employees_owner_all ON public.employees FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY branches_owner_all ON public.branches FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY services_owner_all ON public.services FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY expenses_owner_all ON public.expenses FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY coupons_owner_all ON public.discount_coupons FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY templates_owner_all ON public.message_templates FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY b2b_partners_owner_all ON public.b2b_partners FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY shops_owner_all ON public.shops FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY shop_members_owner_all ON public.shop_members FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY subscriptions_owner_all ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY pricing_plans_owner_all ON public.pricing_plans FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY notifications_owner_all ON public.notifications FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY notification_settings_owner_all ON public.notification_settings FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY profiles_owner_select ON public.profiles FOR SELECT TO authenticated
  USING (public.is_owner());
CREATE POLICY profiles_owner_update ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY profiles_owner_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_owner());
CREATE POLICY profiles_owner_delete ON public.profiles FOR DELETE TO authenticated
  USING (public.is_owner());

CREATE POLICY user_roles_owner_all ON public.user_roles FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY role_audit_logs_owner_select ON public.role_audit_logs FOR SELECT TO authenticated
  USING (public.is_owner());

CREATE POLICY login_attempts_owner_select ON public.login_attempts FOR SELECT TO authenticated
  USING (public.is_owner());

CREATE POLICY video_scans_owner_all ON public.video_scans FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY video_scan_detections_owner_all ON public.video_scan_detections FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY imou_devices_owner_all ON public.imou_devices FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY invites_owner_all ON public.invites FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

-- Re-run sync for the master account so profiles.role catches up
UPDATE public.profiles p
SET role = 'owner'
FROM auth.users u
WHERE p.user_id = u.id AND lower(u.email) = 'lmodirv@gmail.com' AND p.role <> 'owner';
