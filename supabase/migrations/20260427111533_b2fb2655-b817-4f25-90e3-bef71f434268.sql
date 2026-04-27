
-- B.1 Export views (security_invoker → respect existing RLS)
CREATE OR REPLACE VIEW public.v_services_export
WITH (security_invoker = true) AS
SELECT
  s.shop_id, s.id AS service_id, s.reference, s.name, s.name_ar, s.name_fr, s.name_en,
  s.category, s.price, s.duration, s.starting_from, s.is_active,
  s.description, s.created_at
FROM public.services s;

CREATE OR REPLACE VIEW public.v_employees_export
WITH (security_invoker = true) AS
SELECT
  e.shop_id, e.id AS employee_id, e.reference, e.name, e.phone,
  e.role, e.role_type, e.branch_id, b.name AS branch_name,
  e.is_active, e.hire_date, e.created_at
FROM public.employees e
LEFT JOIN public.branches b ON b.id = e.branch_id;

CREATE OR REPLACE VIEW public.v_work_entries_export
WITH (security_invoker = true) AS
SELECT
  o.shop_id, o.id AS order_id, o.reference, o.branch_id,
  o.customer_name, o.car_plate, o.car_type,
  o.employee_id, o.employee_name,
  o.services, o.total_price, o.status,
  o.start_at, o.expected_end_at, o.completed_at,
  o.notes, o.created_at
FROM public.orders o;

GRANT SELECT ON public.v_services_export    TO authenticated;
GRANT SELECT ON public.v_employees_export   TO authenticated;
GRANT SELECT ON public.v_work_entries_export TO authenticated;

-- B.2 Audit RPC for managers/owner to log CSV exports
CREATE OR REPLACE FUNCTION public.log_export_action(
  _shop_id uuid,
  _export_type text,
  _row_count int
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_owner()
    OR (_shop_id IS NOT NULL AND public.is_shop_manager(_shop_id))
  ) THEN
    RAISE EXCEPTION 'Not allowed to export for this shop';
  END IF;

  IF _export_type NOT IN ('services','employees','work_entries','shops','audit_logs') THEN
    RAISE EXCEPTION 'Invalid export type';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    actor_user_id, actor_email, action, target_type, target_id, metadata
  )
  VALUES (
    auth.uid(), v_email, 'export.csv', _export_type, COALESCE(_shop_id::text, 'all'),
    jsonb_build_object('rows', COALESCE(_row_count, 0), 'shop_id', _shop_id)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END
$$;

GRANT EXECUTE ON FUNCTION public.log_export_action(uuid, text, int) TO authenticated;

-- Allow managers/owner to insert their own export rows into audit_logs (RPC is SECURITY DEFINER,
-- so this policy is a belt-and-suspenders measure; we keep the existing owner_insert policy intact).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'audit_logs_export_self_insert'
  ) THEN
    CREATE POLICY audit_logs_export_self_insert
      ON public.audit_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (
        action = 'export.csv'
        AND actor_user_id = auth.uid()
      );
  END IF;
END $$;

-- B.3 Index for audit_logs filtering
CREATE INDEX IF NOT EXISTS audit_logs_action_created_at_idx
  ON public.audit_logs (action, created_at DESC);
