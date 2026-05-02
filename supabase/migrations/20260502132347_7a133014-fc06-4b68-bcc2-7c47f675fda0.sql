
-- 1) Prevent self role escalation via profiles.role updates
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only platform owner or admin may change roles via profiles
    IF auth.uid() IS NOT NULL
       AND NOT public.is_owner()
       AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Changing role is not permitted'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_self_update ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_self_update();

-- 2) Realtime channel authorization
-- Restrict channel subscriptions to channels named after shop ids the user is a member of,
-- or per-user channels named "user:<auth.uid()>".
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_authorized_shop_or_user_channels" ON realtime.messages;
CREATE POLICY "realtime_authorized_shop_or_user_channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- per-user notifications channel
  (realtime.topic() = 'user:' || auth.uid()::text)
  OR
  -- shop-scoped channels: "shop:<uuid>" or "shop:<uuid>:<anything>"
  EXISTS (
    SELECT 1
    FROM public.shop_members sm
    WHERE sm.user_id = auth.uid()
      AND (
        realtime.topic() = 'shop:' || sm.shop_id::text
        OR realtime.topic() LIKE 'shop:' || sm.shop_id::text || ':%'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.shops s
    WHERE s.owner_id = auth.uid()
      AND (
        realtime.topic() = 'shop:' || s.id::text
        OR realtime.topic() LIKE 'shop:' || s.id::text || ':%'
      )
  )
  OR public.is_owner()
);
