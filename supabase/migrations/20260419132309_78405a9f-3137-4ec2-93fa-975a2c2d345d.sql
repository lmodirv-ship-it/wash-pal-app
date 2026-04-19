-- 1. حذف السياسة المفتوحة الخطيرة
DROP POLICY IF EXISTS "Authenticated users can read imou_devices" ON public.imou_devices;

-- 2. إضافة shop_id لربط الأجهزة بالمتاجر
ALTER TABLE public.imou_devices
  ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_imou_devices_shop_id ON public.imou_devices(shop_id);

-- 3. سياسة قراءة محصورة بأعضاء المتجر أو الأدمن/المدير
CREATE POLICY "imou_devices_select_member"
ON public.imou_devices
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR (shop_id IS NOT NULL AND is_shop_member(shop_id))
);