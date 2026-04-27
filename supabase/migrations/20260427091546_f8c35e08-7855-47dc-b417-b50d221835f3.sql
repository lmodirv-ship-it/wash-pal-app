-- Strengthen prevent_role_self_escalation: separate DELETE / UPDATE branches,
-- and lock owner rows before counting to avoid race conditions on last owner.
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  owner_count int;
BEGIN
  -- Branch 1: DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' THEN
      IF auth.uid() IS NOT NULL AND NOT public.is_owner() THEN
        RAISE EXCEPTION 'Only platform owner can remove owner role';
      END IF;
      -- Lock all owner rows to serialize concurrent owner removals
      PERFORM 1 FROM public.user_roles
        WHERE role = 'owner'
        FOR UPDATE;
      SELECT COUNT(*) INTO owner_count
        FROM public.user_roles
        WHERE role = 'owner';
      IF owner_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last platform owner';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- Branch 2: UPDATE
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF auth.uid() IS NULL THEN
        RETURN NEW;
      END IF;

      IF NEW.role = 'owner' OR OLD.role = 'owner' THEN
        IF NOT public.is_owner() THEN
          RAISE EXCEPTION 'Only platform owner can grant or remove owner role';
        END IF;

        -- Last-owner protection on UPDATE-away-from-owner
        IF OLD.role = 'owner' AND NEW.role IS DISTINCT FROM 'owner' THEN
          PERFORM 1 FROM public.user_roles
            WHERE role = 'owner'
            FOR UPDATE;
          SELECT COUNT(*) INTO owner_count
            FROM public.user_roles
            WHERE role = 'owner';
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
  END IF;

  RETURN NULL;
END $function$;

-- Harden can_manage_shop_team: null-safe (null shop => only platform owner passes)
CREATE OR REPLACE FUNCTION public.can_manage_shop_team(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    public.is_owner()
    OR (
      _shop_id IS NOT NULL
      AND (
        EXISTS (
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
        )
      )
    );
$function$;