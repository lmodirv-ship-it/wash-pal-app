
-- 1. Message templates (قوالب المراسلات لكل محل)
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- welcome, reminder, promo, general
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- whatsapp, email, sms
  subject TEXT,
  body TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_admin_all" ON public.message_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "templates_member_all" ON public.message_templates FOR ALL TO authenticated
  USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Discount coupons (كوبونات الخصم)
CREATE TABLE public.discount_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_id, code)
);
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_admin_all" ON public.discount_coupons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "coupons_member_all" ON public.discount_coupons FOR ALL TO authenticated
  USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add prospecting columns to b2b_partners
ALTER TABLE public.b2b_partners
  ADD COLUMN IF NOT EXISTS prospecting_status TEXT NOT NULL DEFAULT 'new', -- new, contacted, interested, not_interested, partner
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_b2b_status ON public.b2b_partners(prospecting_status);
CREATE INDEX IF NOT EXISTS idx_b2b_category ON public.b2b_partners(category);
