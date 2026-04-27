-- Tighten write access on public.services to managers/supervisors only.
-- Read access for all shop members stays unchanged.

DROP POLICY IF EXISTS services_insert_member ON public.services;
DROP POLICY IF EXISTS services_update_member ON public.services;
DROP POLICY IF EXISTS services_delete_member ON public.services;

CREATE POLICY services_insert_manager
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_shop_manager(shop_id));

CREATE POLICY services_update_manager
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (public.is_shop_manager(shop_id))
  WITH CHECK (public.is_shop_manager(shop_id));

CREATE POLICY services_delete_manager
  ON public.services
  FOR DELETE
  TO authenticated
  USING (public.is_shop_manager(shop_id));
