
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

  IF _export_type NOT IN ('services','employees','work_entries','shops','audit_logs','subscriptions') THEN
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
