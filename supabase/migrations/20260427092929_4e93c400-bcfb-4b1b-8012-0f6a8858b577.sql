-- =====================================================================
-- Phase 2: Hard multi-tenant isolation
-- Remove all admin global RLS policies. Keep owner global, admin shop-scoped.
-- =====================================================================

-- 1) Drop *_admin_all policies (admin global override) on tenant tables
DROP POLICY IF EXISTS b2b_partners_admin_all          ON public.b2b_partners;
DROP POLICY IF EXISTS branches_admin_all              ON public.branches;
DROP POLICY IF EXISTS customers_admin_all             ON public.customers;
DROP POLICY IF EXISTS coupons_admin_all               ON public.discount_coupons;
DROP POLICY IF EXISTS employees_admin_all             ON public.employees;
DROP POLICY IF EXISTS expenses_admin_all              ON public.expenses;
DROP POLICY IF EXISTS invites_admin_all               ON public.invites;
DROP POLICY IF EXISTS invoices_admin_all              ON public.invoices;
DROP POLICY IF EXISTS templates_admin_all             ON public.message_templates;
DROP POLICY IF EXISTS notification_settings_admin_all ON public.notification_settings;
DROP POLICY IF EXISTS notifications_admin_all         ON public.notifications;
DROP POLICY IF EXISTS orders_admin_all                ON public.orders;
DROP POLICY IF EXISTS pricing_plans_admin_all         ON public.pricing_plans;
DROP POLICY IF EXISTS services_admin_all              ON public.services;
DROP POLICY IF EXISTS shop_members_admin_all          ON public.shop_members;
DROP POLICY IF EXISTS shops_admin_all                 ON public.shops;
DROP POLICY IF EXISTS subscriptions_admin_all         ON public.subscriptions;
DROP POLICY IF EXISTS video_scans_admin_all           ON public.video_scans;
DROP POLICY IF EXISTS video_scan_detections_admin_all ON public.video_scan_detections;

-- 2) Drop admin global policies on system tables
DROP POLICY IF EXISTS "Admins read all profiles"      ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles"    ON public.profiles;
DROP POLICY IF EXISTS "Admins insert profiles"        ON public.profiles;
DROP POLICY IF EXISTS "Admins delete profiles"        ON public.profiles;

DROP POLICY IF EXISTS "Admins manage roles"           ON public.user_roles;

DROP POLICY IF EXISTS role_audit_logs_admin_select    ON public.role_audit_logs;
DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;

-- 3) imou_devices: drop admin/manager global policies and add shop-scoped ones
DROP POLICY IF EXISTS "Admins manage imou_devices"    ON public.imou_devices;
DROP POLICY IF EXISTS imou_devices_select_member      ON public.imou_devices;

CREATE POLICY imou_devices_select_member
  ON public.imou_devices FOR SELECT TO authenticated
  USING (shop_id IS NOT NULL AND public.is_shop_member(shop_id));

CREATE POLICY imou_devices_manager_insert
  ON public.imou_devices FOR INSERT TO authenticated
  WITH CHECK (shop_id IS NOT NULL AND public.is_shop_manager(shop_id));

CREATE POLICY imou_devices_manager_update
  ON public.imou_devices FOR UPDATE TO authenticated
  USING (shop_id IS NOT NULL AND public.is_shop_manager(shop_id))
  WITH CHECK (shop_id IS NOT NULL AND public.is_shop_manager(shop_id));

CREATE POLICY imou_devices_manager_delete
  ON public.imou_devices FOR DELETE TO authenticated
  USING (shop_id IS NOT NULL AND public.is_shop_manager(shop_id));

-- 4) notifications: tighten insert policy (no more admin global override)
DROP POLICY IF EXISTS notifications_insert_member ON public.notifications;
CREATE POLICY notifications_insert_member
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (shop_id IS NULL OR public.is_shop_member(shop_id))
  );

-- 5) pricing_plans: writes restricted to owner. Public SELECT preserved.
--    (admin_all already dropped above; owner_all already exists.)

-- 6) subscriptions: writes restricted to owner. Read remains shop-scoped.
--    (admin_all already dropped above; owner_all already exists; select_member exists.)

-- 7) Sanity reminder: the following preserved policies enforce shop isolation.
--    - shops_select_owner, shops_update_owner, shops_insert_self
--    - shop_members_owner_manage, shop_members_select_own
--    - *_member_select / _member_insert / _member_update / _member_delete on tenant tables
--    - *_owner_all on every tenant + system table
--    Admin (shop owner) reaches data through shops.owner_id and shop_members.