-- No-Deletion policy for services
CREATE OR REPLACE FUNCTION public.prevent_service_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_count int;
BEGIN
  -- Owner override (platform owner can hard-delete in emergencies)
  IF auth.uid() IS NOT NULL AND public.is_owner() THEN
    RETURN OLD;
  END IF;

  -- Check references in orders (services is text[] of service ids)
  SELECT COUNT(*) INTO v_ref_count
  FROM public.orders
  WHERE OLD.id::text = ANY(services);

  IF v_ref_count > 0 THEN
    RAISE EXCEPTION 'لا يمكن حذف الخدمة "%" لأنها مرتبطة بـ % طلب/طلبات. قم بتعطيلها بدلاً من ذلك (is_active=false).', OLD.name, v_ref_count
      USING ERRCODE = 'P0001';
  END IF;

  -- Block ALL hard deletes; force soft-delete via UPDATE is_active=false
  RAISE EXCEPTION 'الحذف الصلب للخدمات غير مسموح. استخدم التعطيل (is_active=false) بدلاً من الحذف.'
    USING ERRCODE = 'P0001';
END
$$;

DROP TRIGGER IF EXISTS trg_prevent_service_hard_delete ON public.services;
CREATE TRIGGER trg_prevent_service_hard_delete
  BEFORE DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.prevent_service_hard_delete();