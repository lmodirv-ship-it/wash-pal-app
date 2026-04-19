-- Create pricing_plans table for platform subscription packages
CREATE TABLE public.pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  name_fr TEXT NOT NULL DEFAULT '',
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  yearly_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MAD',
  trial_days INTEGER NOT NULL DEFAULT 15,
  max_branches INTEGER NOT NULL DEFAULT 1,
  max_employees INTEGER NOT NULL DEFAULT 5,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active plans (needed for public Pricing page)
CREATE POLICY "pricing_plans_select_all"
  ON public.pricing_plans FOR SELECT
  USING (true);

-- Only admins can manage plans
CREATE POLICY "pricing_plans_admin_all"
  ON public.pricing_plans FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default plans
INSERT INTO public.pricing_plans (code, name_ar, name_en, name_fr, monthly_price, yearly_price, trial_days, max_branches, max_employees, features, is_featured, sort_order)
VALUES
  ('starter',  'المبتدئة',  'Starter',  'Débutant',  0,    0,    15, 1, 3,  '["فرع واحد","حتى 3 موظفين","تقارير أساسية"]'::jsonb,                       false, 1),
  ('pro',      'الاحترافية','Professional','Pro',     199,  1990, 14, 3, 10, '["3 فروع","حتى 10 موظفين","تقارير متقدمة","فواتير غير محدودة"]'::jsonb,  true,  2),
  ('business', 'الأعمال',   'Business', 'Business',  499,  4990, 14, 10,50, '["10 فروع","حتى 50 موظف","دعم أولوية","API كامل","نسخ احتياطي يومي"]'::jsonb, false, 3);