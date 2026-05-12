-- 1) Prevent users from escalating their own role via profiles UPDATE.
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_owner() THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_self_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_role_escalation();

-- 2) Restrict branch deletion to shop managers / owners.
DROP POLICY IF EXISTS branches_member_delete ON public.branches;
CREATE POLICY branches_manager_delete ON public.branches
FOR DELETE
USING (public.is_shop_manager(shop_id));
