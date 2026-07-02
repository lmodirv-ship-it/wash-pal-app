
-- Fix referral_codes exposure: restrict SELECT to expose only via a public view of `code`, or authenticated users seeing their own.
DROP POLICY IF EXISTS referral_codes_public_select ON public.referral_codes;

-- Allow users to read only their own referral row.
CREATE POLICY referral_codes_self_select ON public.referral_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Owner can read all
CREATE POLICY referral_codes_owner_select ON public.referral_codes
  FOR SELECT TO authenticated USING (public.is_owner());

REVOKE SELECT ON public.referral_codes FROM anon;
