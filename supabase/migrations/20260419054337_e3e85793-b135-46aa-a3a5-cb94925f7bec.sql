DROP POLICY IF EXISTS notifications_insert_member ON public.notifications;
CREATE POLICY notifications_insert_member
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      auth.uid() = user_id
      AND (shop_id IS NULL OR public.is_shop_member(shop_id))
    )
  );