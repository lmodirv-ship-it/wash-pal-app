
-- Owner audit logs: generic platform-wide audit trail (separate from role_audit_logs which is role-changes-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_owner_select" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_owner());

CREATE POLICY "audit_logs_owner_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_owner() AND actor_user_id = auth.uid());

-- helper to insert from owner UI
CREATE OR REPLACE FUNCTION public.log_owner_action(
  _action text,
  _target_type text,
  _target_id text,
  _old_value jsonb DEFAULT NULL,
  _new_value jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS uuid
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

  INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, old_value, new_value, metadata)
  VALUES (auth.uid(), v_email, _action, _target_type, _target_id, _old_value, _new_value, _metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

-- Add suspended flag to shops for owner-controlled freeze
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- Owner broadcast: insert notifications for many users at once (in-app only)
CREATE OR REPLACE FUNCTION public.owner_broadcast(
  _title text,
  _message text,
  _scope text DEFAULT 'all'  -- 'all' | 'owners' | 'admins'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can broadcast';
  END IF;

  IF _scope = 'all' THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT id, 'announcement', _title, _message FROM auth.users;
  ELSIF _scope = 'admins' THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT DISTINCT user_id, 'announcement', _title, _message
      FROM public.user_roles WHERE role IN ('admin','supervisor','manager','owner');
  ELSIF _scope = 'owners' THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT DISTINCT user_id, 'announcement', _title, _message
      FROM public.user_roles WHERE role = 'owner';
  ELSE
    RAISE EXCEPTION 'Invalid scope: %', _scope;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, new_value, metadata)
  SELECT auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()),
         'owner.broadcast', 'notification', _scope,
         jsonb_build_object('title', _title, 'message', _message),
         jsonb_build_object('recipients', v_count);

  RETURN v_count;
END $$;

-- Owner shop control: suspend/unsuspend with audit
CREATE OR REPLACE FUNCTION public.owner_set_shop_suspension(
  _shop_id uuid,
  _suspend boolean,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can suspend shops';
  END IF;

  SELECT jsonb_build_object('suspended', suspended, 'reason', suspended_reason) INTO v_old
  FROM public.shops WHERE id = _shop_id;

  IF v_old IS NULL THEN
    RAISE EXCEPTION 'Shop not found';
  END IF;

  UPDATE public.shops
     SET suspended = _suspend,
         suspended_reason = CASE WHEN _suspend THEN _reason ELSE NULL END,
         suspended_at    = CASE WHEN _suspend THEN now() ELSE NULL END,
         updated_at      = now()
   WHERE id = _shop_id;

  v_new := jsonb_build_object('suspended', _suspend, 'reason', _reason);

  INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, old_value, new_value)
  SELECT auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()),
         CASE WHEN _suspend THEN 'shop.suspend' ELSE 'shop.unsuspend' END,
         'shop', _shop_id::text, v_old, v_new;
END $$;
