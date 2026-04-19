-- 1) Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','pro','business')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','expired','canceled')),
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_shop ON public.subscriptions(shop_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: super admin manages all
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: shop members can read their shop's subscription
CREATE POLICY "subscriptions_select_member" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (is_shop_member(shop_id));

-- updated_at trigger
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Auto-create 14-day Starter trial for new shops
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (shop_id, plan, status, monthly_price, current_period_start, current_period_end)
  VALUES (NEW.id, 'starter', 'trialing', 0, now(), now() + INTERVAL '14 days')
  ON CONFLICT (shop_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shops_create_subscription
  AFTER INSERT ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();

-- 3) Helper: read-only mode when subscription expired
CREATE OR REPLACE FUNCTION public.is_shop_readonly(_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE shop_id = _shop_id
      AND (status IN ('expired','canceled') OR current_period_end < now())
  );
$$;

-- 4) Backfill subscriptions for existing shops
INSERT INTO public.subscriptions (shop_id, plan, status, monthly_price, current_period_start, current_period_end)
SELECT id, 'starter', 'trialing', 0, now(), now() + INTERVAL '14 days'
FROM public.shops
ON CONFLICT (shop_id) DO NOTHING;