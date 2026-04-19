-- =========================================
-- 1) Add billing_cycle to subscriptions
-- =========================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly';

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_billing_cycle_check
  CHECK (billing_cycle IN ('monthly','quarterly','semiannual','yearly'));

-- =========================================
-- 2) notification_settings table
-- =========================================
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  email TEXT,
  phone TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily','weekly','monthly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_settings_admin_all ON public.notification_settings;
CREATE POLICY notification_settings_admin_all
  ON public.notification_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS notification_settings_select_member ON public.notification_settings;
CREATE POLICY notification_settings_select_member
  ON public.notification_settings FOR SELECT TO authenticated
  USING (public.is_shop_member(shop_id));

DROP POLICY IF EXISTS notification_settings_manage_manager ON public.notification_settings;
CREATE POLICY notification_settings_manage_manager
  ON public.notification_settings FOR ALL TO authenticated
  USING (public.is_shop_manager(shop_id))
  WITH CHECK (public.is_shop_manager(shop_id));

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create default notification_settings when a shop is created
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_settings (shop_id, email_enabled, whatsapp_enabled, frequency)
  VALUES (NEW.id, true, false, 'weekly')
  ON CONFLICT (shop_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shops_create_notification_settings ON public.shops;
CREATE TRIGGER shops_create_notification_settings
  AFTER INSERT ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_settings();

-- Backfill notification_settings for existing shops
INSERT INTO public.notification_settings (shop_id)
SELECT s.id FROM public.shops s
LEFT JOIN public.notification_settings ns ON ns.shop_id = s.id
WHERE ns.id IS NULL;

-- =========================================
-- 3) notifications table (in-app bell)
-- =========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','subscription','business','team')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_admin_all ON public.notifications;
CREATE POLICY notifications_admin_all
  ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Insert: members can create notifications for users within their shop, admins anywhere
DROP POLICY IF EXISTS notifications_insert_member ON public.notifications;
CREATE POLICY notifications_insert_member
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (shop_id IS NOT NULL AND public.is_shop_member(shop_id))
  );