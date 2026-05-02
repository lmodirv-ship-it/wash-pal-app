
-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'footer',
  language TEXT NOT NULL DEFAULT 'ar',
  is_active BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscribers
FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- Only platform owner can view subscribers
CREATE POLICY "newsletter_owner_select" ON public.newsletter_subscribers
FOR SELECT TO authenticated
USING (is_owner());

CREATE POLICY "newsletter_owner_update" ON public.newsletter_subscribers
FOR UPDATE TO authenticated
USING (is_owner()) WITH CHECK (is_owner());

CREATE POLICY "newsletter_owner_delete" ON public.newsletter_subscribers
FOR DELETE TO authenticated
USING (is_owner());

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);

-- Referral codes for shop owners
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  uses_count INTEGER NOT NULL DEFAULT 0,
  signups_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_codes_public_select" ON public.referral_codes
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "referral_codes_self_insert" ON public.referral_codes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "referral_codes_owner_all" ON public.referral_codes
FOR ALL TO authenticated
USING (is_owner()) WITH CHECK (is_owner());

CREATE INDEX idx_referral_code ON public.referral_codes(code);

-- Referral events (clicks + signups)
CREATE TABLE public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'click',
  referred_user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_events_public_insert" ON public.referral_events
FOR INSERT TO anon, authenticated
WITH CHECK (event_type IN ('click','signup') AND length(code) <= 32);

CREATE POLICY "referral_events_owner_select" ON public.referral_events
FOR SELECT TO authenticated
USING (is_owner());

CREATE POLICY "referral_events_self_select" ON public.referral_events
FOR SELECT TO authenticated
USING (code IN (SELECT code FROM public.referral_codes WHERE user_id = auth.uid()));

CREATE INDEX idx_referral_events_code ON public.referral_events(code);

-- Function to generate a short referral code from user_id
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    new_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = new_code);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$;

-- RPC: get or create the caller's referral code
CREATE OR REPLACE FUNCTION public.get_or_create_my_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing TEXT;
  new_code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT code INTO existing FROM public.referral_codes WHERE user_id = auth.uid();
  IF existing IS NOT NULL THEN
    RETURN existing;
  END IF;

  new_code := public.generate_referral_code();
  INSERT INTO public.referral_codes (user_id, code) VALUES (auth.uid(), new_code);
  RETURN new_code;
END;
$$;

-- RPC: track a click (public)
CREATE OR REPLACE FUNCTION public.track_referral_click(_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _code IS NULL OR length(_code) = 0 OR length(_code) > 32 THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = upper(_code)) THEN
    RETURN;
  END IF;
  INSERT INTO public.referral_events (code, event_type) VALUES (upper(_code), 'click');
  UPDATE public.referral_codes SET uses_count = uses_count + 1 WHERE code = upper(_code);
END;
$$;
