-- 1) Drop the old CHECK constraint FIRST so we can update values freely
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- 2) Add trial_ends_at column
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 3) Migrate existing 'trialing' rows to 'trial'
UPDATE public.subscriptions
SET status = 'trial'
WHERE status = 'trialing';

-- 4) Backfill trial_ends_at from current_period_end where trial
UPDATE public.subscriptions
SET trial_ends_at = current_period_end
WHERE trial_ends_at IS NULL AND status = 'trial';

-- 5) Now add the new CHECK constraint
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trial','active','expired','canceled'));

-- 6) Update default period length to 15 days
ALTER TABLE public.subscriptions
  ALTER COLUMN current_period_end SET DEFAULT (now() + INTERVAL '15 days');

-- 7) Update auto-create trigger function: 15-day trial, status='trial', set trial_ends_at
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    shop_id, plan, status, monthly_price,
    current_period_start, current_period_end, trial_ends_at
  )
  VALUES (
    NEW.id, 'starter', 'trial', 0,
    now(), now() + INTERVAL '15 days', now() + INTERVAL '15 days'
  )
  ON CONFLICT (shop_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 8) Update is_shop_readonly to handle trial expiry separately
CREATE OR REPLACE FUNCTION public.is_shop_readonly(_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE shop_id = _shop_id
      AND (
        status IN ('expired','canceled')
        OR (status = 'trial' AND trial_ends_at < now())
        OR (status = 'active' AND current_period_end < now())
      )
  );
$$;