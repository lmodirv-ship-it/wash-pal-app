-- Owner Database Control Center — Safe RPCs (Owner-only)

-- 1) DB Health
CREATE OR REPLACE FUNCTION public.owner_db_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active int;
  v_total int;
  v_db_size text;
  v_uptime text;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can read DB health';
  END IF;

  SELECT count(*) INTO v_active FROM pg_stat_activity WHERE state = 'active';
  SELECT count(*) INTO v_total  FROM pg_stat_activity;
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO v_db_size;
  SELECT (now() - pg_postmaster_start_time())::text INTO v_uptime;

  RETURN jsonb_build_object(
    'active_connections', v_active,
    'total_connections',  v_total,
    'db_size',            v_db_size,
    'uptime',             v_uptime,
    'checked_at',         now()
  );
END $$;

REVOKE ALL ON FUNCTION public.owner_db_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_db_health() TO authenticated;

-- 2) Tenant integrity
CREATE OR REPLACE FUNCTION public.owner_tenant_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shops_no_owner int;
  v_subs_orphan int;
  v_members_orphan int;
  v_orders_orphan int;
  v_employees_orphan int;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can run integrity checks';
  END IF;

  SELECT count(*) INTO v_shops_no_owner FROM public.shops WHERE owner_id IS NULL;
  SELECT count(*) INTO v_subs_orphan FROM public.subscriptions s
    WHERE NOT EXISTS (SELECT 1 FROM public.shops sh WHERE sh.id = s.shop_id);
  SELECT count(*) INTO v_members_orphan FROM public.shop_members sm
    WHERE NOT EXISTS (SELECT 1 FROM public.shops sh WHERE sh.id = sm.shop_id);
  SELECT count(*) INTO v_orders_orphan FROM public.orders o
    WHERE NOT EXISTS (SELECT 1 FROM public.shops sh WHERE sh.id = o.shop_id);
  SELECT count(*) INTO v_employees_orphan FROM public.employees e
    WHERE NOT EXISTS (SELECT 1 FROM public.shops sh WHERE sh.id = e.shop_id);

  RETURN jsonb_build_object(
    'shops_without_owner',    v_shops_no_owner,
    'subscriptions_orphaned', v_subs_orphan,
    'members_orphaned',       v_members_orphan,
    'orders_orphaned',        v_orders_orphan,
    'employees_orphaned',     v_employees_orphan,
    'checked_at',             now()
  );
END $$;

REVOKE ALL ON FUNCTION public.owner_tenant_integrity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_tenant_integrity() TO authenticated;

-- 3) Set user role (with last-owner protection)
CREATE OR REPLACE FUNCTION public.owner_set_user_role(_target_user_id uuid, _new_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old text;
  v_email text;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can change roles';
  END IF;

  SELECT role::text INTO v_old FROM public.user_roles
    WHERE user_id = _target_user_id ORDER BY created_at DESC LIMIT 1;

  -- The trigger prevent_role_self_escalation handles last-owner protection on updates/deletes.
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _new_role);

  SELECT email INTO v_email FROM auth.users WHERE id = _target_user_id;

  INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, old_value, new_value)
  SELECT auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()),
         'owner.set_role', 'user', _target_user_id::text,
         jsonb_build_object('role', v_old, 'email', v_email),
         jsonb_build_object('role', _new_role::text, 'email', v_email);
END $$;

REVOKE ALL ON FUNCTION public.owner_set_user_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_set_user_role(uuid, public.app_role) TO authenticated;

-- 4) Recent security events
CREATE OR REPLACE FUNCTION public.owner_recent_security_events(_limit int DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_logins jsonb;
  v_role_changes jsonb;
  v_audit jsonb;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can read security events';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_logins FROM (
    SELECT id, admin_email, ip_address, created_at, (intruder_photo IS NOT NULL) AS has_photo
    FROM public.login_attempts ORDER BY created_at DESC LIMIT _limit
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_role_changes FROM (
    SELECT id, target_user_id, changed_by, source_table, old_role, new_role, action, created_at
    FROM public.role_audit_logs ORDER BY created_at DESC LIMIT _limit
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_audit FROM (
    SELECT id, actor_email, action, target_type, target_id, created_at
    FROM public.audit_logs ORDER BY created_at DESC LIMIT _limit
  ) t;

  RETURN jsonb_build_object(
    'login_attempts', v_logins,
    'role_changes',   v_role_changes,
    'audit',          v_audit
  );
END $$;

REVOKE ALL ON FUNCTION public.owner_recent_security_events(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_recent_security_events(int) TO authenticated;