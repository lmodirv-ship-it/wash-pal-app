-- 1) App Settings (single row, key-value JSON)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT DEFAULT 'الموقع تحت الصيانة. عُد لاحقاً.',
  signup_enabled BOOLEAN NOT NULL DEFAULT true,
  welcome_message TEXT DEFAULT '',
  brand_logo_url TEXT,
  brand_primary_color TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_settings_select_all
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY app_settings_owner_update
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- 2) Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_flags_select_all
  ON public.feature_flags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY feature_flags_owner_all
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Seed common flags for car-wash SaaS
INSERT INTO public.feature_flags (key, label, description, category, enabled) VALUES
  ('cameras', 'كاميرات المراقبة', 'تفعيل صفحات IMOU والكاميرات', 'modules', true),
  ('b2b_partners', 'شركاء B2B', 'تفعيل وحدة شركاء B2B بالنقاط', 'modules', true),
  ('appointments', 'المواعيد', 'تفعيل نظام حجز المواعيد', 'modules', true),
  ('coupons', 'كوبونات الخصم', 'تفعيل وحدة كوبونات الخصم', 'modules', true),
  ('whatsapp_messaging', 'رسائل واتساب', 'تفعيل قوالب رسائل واتساب', 'communication', true),
  ('plate_scanner', 'ماسح اللوحات', 'تفعيل قارئ لوحات السيارات', 'modules', true),
  ('face_recognition', 'التعرف على الوجه', 'تفعيل دخول الإدارة بالوجه', 'security', true),
  ('public_signup', 'تسجيل عام جديد', 'السماح بإنشاء حسابات جديدة', 'auth', true)
ON CONFLICT (key) DO NOTHING;

-- 3) Impersonation Sessions (read-only)
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  target_shop_id UUID NOT NULL,
  reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY impersonation_sessions_owner_all
  ON public.impersonation_sessions FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- 4) RPC: start impersonation (read-only audit + audit_log)
CREATE OR REPLACE FUNCTION public.owner_start_impersonation(_shop_id UUID, _reason TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_email TEXT;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner can impersonate';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = _shop_id) THEN
    RAISE EXCEPTION 'Shop not found';
  END IF;

  INSERT INTO public.impersonation_sessions (owner_user_id, target_shop_id, reason)
  VALUES (auth.uid(), _shop_id, _reason)
  RETURNING id INTO v_id;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, new_value)
  VALUES (auth.uid(), v_email, 'owner.impersonate.start', 'shop', _shop_id::text,
          jsonb_build_object('reason', _reason, 'session_id', v_id));

  RETURN v_id;
END $$;

-- 5) RPC: end impersonation
CREATE OR REPLACE FUNCTION public.owner_end_impersonation(_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_email TEXT; v_shop UUID;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only platform owner';
  END IF;

  UPDATE public.impersonation_sessions
     SET ended_at = now()
   WHERE id = _session_id AND ended_at IS NULL
   RETURNING target_shop_id INTO v_shop;

  IF v_shop IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
    INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, new_value)
    VALUES (auth.uid(), v_email, 'owner.impersonate.end', 'shop', v_shop::text,
            jsonb_build_object('session_id', _session_id));
  END IF;
END $$;

-- 6) Trigger: auto-update updated_at on app_settings
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Trigger: log app_settings changes to audit_logs
CREATE OR REPLACE FUNCTION public.log_app_settings_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, old_value, new_value)
  VALUES (auth.uid(), v_email, 'settings.update', 'app_settings', '1',
          to_jsonb(OLD), to_jsonb(NEW));
  NEW.updated_by := auth.uid();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_log_app_settings
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_app_settings_changes();

CREATE OR REPLACE FUNCTION public.log_feature_flag_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, old_value, new_value)
  VALUES (auth.uid(), v_email,
          CASE TG_OP WHEN 'INSERT' THEN 'feature_flag.create'
                     WHEN 'UPDATE' THEN 'feature_flag.update'
                     ELSE 'feature_flag.delete' END,
          'feature_flag',
          COALESCE(NEW.key, OLD.key),
          CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
          CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END);
  IF TG_OP <> 'DELETE' THEN
    NEW.updated_by := auth.uid();
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;

CREATE TRIGGER trg_log_feature_flags
  BEFORE INSERT OR UPDATE OR DELETE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.log_feature_flag_changes();