-- 1) Create app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) has_role security definer (no recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4) Policies on user_roles
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Backfill roles from profiles into user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id,
  CASE role
    WHEN 'admin' THEN 'admin'::public.app_role
    WHEN 'manager' THEN 'manager'::public.app_role
    WHEN 'customer' THEN 'customer'::public.app_role
    ELSE 'employee'::public.app_role
  END
FROM public.profiles
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 6) Fix profiles policies (remove recursive ones)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7) Fix login_attempts admin policy to use has_role
DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;
CREATE POLICY "Admins can view login attempts" ON public.login_attempts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));