
CREATE OR REPLACE FUNCTION public.bump_referral_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'signup' THEN
    UPDATE public.referral_codes
       SET signups_count = signups_count + 1
     WHERE code = NEW.code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_referral_signup ON public.referral_events;
CREATE TRIGGER trg_bump_referral_signup
AFTER INSERT ON public.referral_events
FOR EACH ROW EXECUTE FUNCTION public.bump_referral_signup();
