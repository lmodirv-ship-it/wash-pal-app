-- Allow SECURITY DEFINER functions (which run as superuser, auth.uid() IS NULL) to bypass the guard
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow internal/system updates (no auth context) and admins
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Now run the data fix
UPDATE public.profiles p
SET role = 'supervisor'
WHERE role = 'employee'
  AND EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_id = p.user_id);

INSERT INTO public.user_roles (user_id, role)
SELECT s.owner_id, 'supervisor'::app_role
FROM public.shops s
ON CONFLICT DO NOTHING;

DELETE FROM public.user_roles ur
WHERE ur.role = 'employee'
  AND EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_id = ur.user_id)
  AND EXISTS (SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = ur.user_id AND ur2.role = 'supervisor');

-- Update signup trigger
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
  IF user_role NOT IN ('admin','manager','supervisor','employee','customer') THEN
    user_role := 'employee';
  END IF;

  INSERT INTO public.profiles (user_id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), user_role);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Auto-promote owner on shop creation
CREATE OR REPLACE FUNCTION public.promote_owner_on_shop_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'supervisor'
  WHERE user_id = NEW.owner_id AND role = 'employee';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.owner_id, 'supervisor'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_shop_created_promote_owner ON public.shops;
CREATE TRIGGER on_shop_created_promote_owner
AFTER INSERT ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.promote_owner_on_shop_create();