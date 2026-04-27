
-- 1. Add reference_code to shops
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS reference_code text UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_shop_reference_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_ref text;
  exists_count int;
BEGIN
  IF NEW.reference_code IS NOT NULL AND NEW.reference_code <> '' THEN
    RETURN NEW;
  END IF;
  LOOP
    new_ref := 'SH-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.shops WHERE reference_code = new_ref;
    IF exists_count = 0 THEN
      NEW.reference_code := new_ref;
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_shop_reference_code ON public.shops;
CREATE TRIGGER trg_generate_shop_reference_code
  BEFORE INSERT ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_shop_reference_code();

-- Backfill existing shops missing a code
DO $$
DECLARE
  r RECORD;
  new_ref text;
  ec int;
BEGIN
  FOR r IN SELECT id FROM public.shops WHERE reference_code IS NULL LOOP
    LOOP
      new_ref := 'SH-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
      SELECT COUNT(*) INTO ec FROM public.shops WHERE reference_code = new_ref;
      EXIT WHEN ec = 0;
    END LOOP;
    UPDATE public.shops SET reference_code = new_ref WHERE id = r.id;
  END LOOP;
END $$;

-- 2. employee_join_requests table
CREATE TABLE IF NOT EXISTS public.employee_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL,
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  requested_role text NOT NULL DEFAULT 'employee',
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_join_requests_status_check CHECK (status IN ('pending','approved','rejected'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_request_per_email_per_shop
  ON public.employee_join_requests (shop_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ejr_shop ON public.employee_join_requests (shop_id);
CREATE INDEX IF NOT EXISTS idx_ejr_user ON public.employee_join_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_ejr_status ON public.employee_join_requests (status);

DROP TRIGGER IF EXISTS trg_ejr_updated_at ON public.employee_join_requests;
CREATE TRIGGER trg_ejr_updated_at
  BEFORE UPDATE ON public.employee_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.employee_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS: owner global
CREATE POLICY "ejr_owner_all" ON public.employee_join_requests
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- RLS: requester sees own (by user_id OR by email match)
CREATE POLICY "ejr_self_select" ON public.employee_join_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), ''))
  );

-- RLS: requester can insert their own request
CREATE POLICY "ejr_self_insert" ON public.employee_join_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND lower(email) = lower(COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), ''))
  );

-- RLS: shop managers (owner/admin/supervisor/manager of that shop) can see and manage
CREATE POLICY "ejr_manager_select" ON public.employee_join_requests
  FOR SELECT TO authenticated
  USING (public.can_manage_shop_team(shop_id));

CREATE POLICY "ejr_manager_update" ON public.employee_join_requests
  FOR UPDATE TO authenticated
  USING (public.can_manage_shop_team(shop_id))
  WITH CHECK (public.can_manage_shop_team(shop_id));

CREATE POLICY "ejr_manager_delete" ON public.employee_join_requests
  FOR DELETE TO authenticated
  USING (public.can_manage_shop_team(shop_id));

-- 3. RPC: submit join request by reference code
CREATE OR REPLACE FUNCTION public.submit_join_request(
  _reference_code text,
  _full_name text,
  _phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_email text;
  v_request_id uuid;
  v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, owner_id INTO v_shop_id, v_owner
  FROM public.shops
  WHERE reference_code = upper(trim(_reference_code))
  LIMIT 1;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Invalid shop reference code' USING ERRCODE = 'P0002';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;

  -- Already a member? Skip.
  IF EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = v_shop_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You are already a member of this shop' USING ERRCODE = 'P0003';
  END IF;

  -- Existing pending? Return it.
  SELECT id INTO v_request_id FROM public.employee_join_requests
   WHERE shop_id = v_shop_id AND lower(email) = lower(v_email) AND status = 'pending'
   LIMIT 1;
  IF v_request_id IS NOT NULL THEN
    RETURN v_request_id;
  END IF;

  INSERT INTO public.employee_join_requests (
    shop_id, user_id, full_name, email, phone, requested_role, status
  ) VALUES (
    v_shop_id, auth.uid(), _full_name, v_email, _phone, 'employee', 'pending'
  ) RETURNING id INTO v_request_id;

  -- Notify shop owner
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, shop_id, type, title, message)
    VALUES (
      v_owner, v_shop_id, 'join_request',
      'طلب انضمام جديد',
      _full_name || ' (' || v_email || ') يطلب الانضمام كموظف'
    );
  END IF;

  RETURN v_request_id;
END;
$$;

-- 4. RPC: approve
CREATE OR REPLACE FUNCTION public.approve_join_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.employee_join_requests%ROWTYPE;
  v_branch_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO req FROM public.employee_join_requests WHERE id = _request_id FOR UPDATE;
  IF req.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF req.status <> 'pending' THEN RAISE EXCEPTION 'Request already %', req.status; END IF;

  IF NOT public.can_manage_shop_team(req.shop_id) THEN
    RAISE EXCEPTION 'Not allowed to approve for this shop';
  END IF;

  IF req.user_id IS NULL THEN
    RAISE EXCEPTION 'Request has no linked user yet';
  END IF;

  -- shop_members
  INSERT INTO public.shop_members (shop_id, user_id, role, invited_by)
  VALUES (req.shop_id, req.user_id, 'employee', auth.uid())
  ON CONFLICT DO NOTHING;

  -- Pick a default branch
  SELECT id INTO v_branch_id FROM public.branches
   WHERE shop_id = req.shop_id AND is_active = true
   ORDER BY created_at ASC LIMIT 1;

  IF v_branch_id IS NULL THEN
    INSERT INTO public.branches (shop_id, name, phone, address)
    VALUES (req.shop_id, 'الفرع الرئيسي', '', '')
    RETURNING id INTO v_branch_id;
  END IF;

  -- employees row (one active per user_id+shop)
  IF NOT EXISTS (
    SELECT 1 FROM public.employees
     WHERE shop_id = req.shop_id AND user_id = req.user_id AND is_active = true
  ) THEN
    INSERT INTO public.employees (shop_id, branch_id, user_id, name, phone, role, role_type, is_active)
    VALUES (req.shop_id, v_branch_id, req.user_id, req.full_name, COALESCE(req.phone, ''), 'employee', 'employee', true);
  END IF;

  -- Cache role on profile
  UPDATE public.profiles SET role = 'employee' WHERE user_id = req.user_id AND role = 'customer';
  INSERT INTO public.user_roles (user_id, role) VALUES (req.user_id, 'employee'::public.app_role)
  ON CONFLICT DO NOTHING;

  -- Update request
  UPDATE public.employee_join_requests
     SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = req.id;

  -- Notify employee
  INSERT INTO public.notifications (user_id, shop_id, type, title, message)
  VALUES (req.user_id, req.shop_id, 'join_approved',
          'تمت الموافقة على طلبك',
          'تمت الموافقة على انضمامك للمتجر. يمكنك الآن الدخول إلى لوحة الموظف.');
END;
$$;

-- 5. RPC: reject
CREATE OR REPLACE FUNCTION public.reject_join_request(_request_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.employee_join_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO req FROM public.employee_join_requests WHERE id = _request_id FOR UPDATE;
  IF req.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF req.status <> 'pending' THEN RAISE EXCEPTION 'Request already %', req.status; END IF;
  IF NOT public.can_manage_shop_team(req.shop_id) THEN
    RAISE EXCEPTION 'Not allowed to reject for this shop';
  END IF;

  UPDATE public.employee_join_requests
     SET status = 'rejected', rejection_reason = _reason,
         reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = req.id;

  IF req.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, shop_id, type, title, message)
    VALUES (req.user_id, req.shop_id, 'join_rejected',
            'تم رفض طلب الانضمام',
            COALESCE('السبب: ' || _reason, 'تم رفض طلبك للانضمام إلى هذا المتجر.'));
  END IF;
END;
$$;
