CREATE OR REPLACE FUNCTION public.prevent_service_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'الحذف الصلب للخدمات غير مسموح. استخدم التعطيل (is_active=false) بدلاً من الحذف.'
    USING ERRCODE = 'P0001';
END
$function$;

DROP POLICY IF EXISTS services_delete_manager ON public.services;
DROP POLICY IF EXISTS services_owner_all ON public.services;

CREATE POLICY services_owner_select
ON public.services
FOR SELECT
TO authenticated
USING (public.is_owner());

CREATE POLICY services_owner_insert
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (public.is_owner());

CREATE POLICY services_owner_update
ON public.services
FOR UPDATE
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());