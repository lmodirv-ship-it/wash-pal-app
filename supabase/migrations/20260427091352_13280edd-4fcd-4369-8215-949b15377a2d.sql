-- 1) Harden handle_new_user: never allow signup-time self-assignment of owner/admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');

  -- Never allow self-signup as platform owner or shop admin
  IF user_role IN ('owner', 'admin') THEN
    user_role := 'customer';
  END IF;

  IF user_role NOT IN ('manager','supervisor','employee','customer') THEN
    user_role := 'employee';
  END IF;

  INSERT INTO public.profiles (user_id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), user_role);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END $function$;

-- 2) Strengthen prevent_role_self_escalation:
--    - keep "only owner can grant/remove owner"
--    - keep "only owner or admin can change roles"
--    - add "cannot remove the last owner" (covers DELETE and UPDATE-away-from-owner)
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  owner_count int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' THEN
      IF auth.uid() IS NOT NULL AND NOT public.is_owner() THEN
        RAISE EXCEPTION 'Only platform owner can remove owner role';
      END IF;
      SELECT COUNT(*) INTO owner_count FROM public.user_roles WHERE role = 'owner';
      IF owner_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last platform owner';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    IF NEW.role = 'owner' OR OLD.role = 'owner' THEN
      IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Only platform owner can grant or remove owner role';
      END IF;
      -- Block losing the last owner via UPDATE
      IF OLD.role = 'owner' AND NEW.role <> 'owner' THEN
        SELECT COUNT(*) INTO owner_count FROM public.user_roles WHERE role = 'owner';
        IF owner_count <= 1 THEN
          RAISE EXCEPTION 'Cannot remove the last platform owner';
        END IF;
      END IF;
    END IF;

    IF NOT (public.is_owner() OR public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
      RAISE EXCEPTION 'Only owner or admin can change user roles';
    END IF;
  END IF;

  RETURN NEW;
END $function$;

-- Ensure trigger covers DELETE as well as UPDATE
DROP TRIGGER IF EXISTS prevent_role_self_escalation_trg ON public.user_roles;
CREATE TRIGGER prevent_role_self_escalation_trg
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 3) Helper: can_manage_shop_team(_shop_id)
CREATE OR REPLACE FUNCTION public.can_manage_shop_team(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.is_owner()
    OR EXISTS (
      SELECT 1 FROM public.shops
      WHERE id = _shop_id AND owner_id = auth.uid()
    )
    OR (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      AND EXISTS (
        SELECT 1 FROM public.shop_members
        WHERE shop_id = _shop_id AND user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = _shop_id
        AND user_id = auth.uid()
        AND role = 'supervisor'
    );
$function$;