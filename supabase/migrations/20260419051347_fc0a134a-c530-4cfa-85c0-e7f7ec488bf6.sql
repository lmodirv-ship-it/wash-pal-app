-- Add invited_by tracking to shop_members
ALTER TABLE public.shop_members ADD COLUMN IF NOT EXISTS invited_by uuid;

-- Invites table
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('manager','employee','supervisor')),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (shop_id, email, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_invites_email ON public.invites (lower(email));
CREATE INDEX idx_invites_shop ON public.invites (shop_id);
CREATE INDEX idx_invites_token ON public.invites (token);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Helper: is user a supervisor or manager of a given shop?
CREATE OR REPLACE FUNCTION public.is_shop_manager(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shops WHERE id = _shop_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = _shop_id AND user_id = auth.uid() AND role IN ('supervisor','manager')
  );
$$;

-- RLS policies for invites
CREATE POLICY invites_admin_all ON public.invites
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY invites_manage_by_shop_managers ON public.invites
  FOR ALL TO authenticated
  USING (public.is_shop_manager(shop_id))
  WITH CHECK (public.is_shop_manager(shop_id) AND invited_by = auth.uid());

CREATE POLICY invites_select_own_email ON public.invites
  FOR SELECT TO authenticated
  USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Auto-link invites to a shop on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_invites()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For every pending invite matching the new user's email, add to shop_members
  INSERT INTO public.shop_members (shop_id, user_id, role, invited_by)
  SELECT i.shop_id, NEW.id, i.role, i.invited_by
  FROM public.invites i
  WHERE lower(i.email) = lower(NEW.email) AND i.status = 'pending'
  ON CONFLICT DO NOTHING;

  UPDATE public.invites
  SET status = 'accepted', accepted_at = now()
  WHERE lower(email) = lower(NEW.email) AND status = 'pending';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_invites ON auth.users;
CREATE TRIGGER on_auth_user_created_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_invites();

-- RPC for an authenticated existing user to accept an invite by token
CREATE OR REPLACE FUNCTION public.accept_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invites;
  user_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  SELECT * INTO inv FROM public.invites WHERE token = _token AND status = 'pending';
  IF inv.id IS NULL THEN RAISE EXCEPTION 'Invite not found or already used'; END IF;
  IF lower(inv.email) <> lower(user_email) THEN RAISE EXCEPTION 'This invite is for a different email'; END IF;

  INSERT INTO public.shop_members (shop_id, user_id, role, invited_by)
  VALUES (inv.shop_id, auth.uid(), inv.role, inv.invited_by)
  ON CONFLICT DO NOTHING;

  UPDATE public.invites SET status = 'accepted', accepted_at = now() WHERE id = inv.id;
  RETURN inv.shop_id;
END;
$$;