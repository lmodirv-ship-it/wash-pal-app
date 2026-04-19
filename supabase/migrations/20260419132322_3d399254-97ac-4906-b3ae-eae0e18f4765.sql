-- إصلاح سياسة INSERT المفتوحة على login_attempts
DROP POLICY IF EXISTS "Service role can insert login attempts" ON public.login_attempts;

CREATE POLICY "Service role inserts login attempts"
ON public.login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);