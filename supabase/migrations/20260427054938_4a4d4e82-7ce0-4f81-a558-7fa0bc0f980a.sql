-- 1) Re-create the trigger that auto-creates profile + role rows for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Re-create the trigger that auto-accepts pending invites on signup
DROP TRIGGER IF EXISTS on_auth_user_created_invites ON auth.users;
CREATE TRIGGER on_auth_user_created_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_invites();

-- 3) Backfill: create profiles for any existing auth.users without one
INSERT INTO public.profiles (user_id, name, role)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'name', ''),
       CASE
         WHEN lower(u.email) = 'lmodirv@gmail.com' THEN 'admin'
         WHEN COALESCE(u.raw_user_meta_data->>'role','employee') IN ('admin','manager','supervisor','employee','customer')
              THEN COALESCE(u.raw_user_meta_data->>'role','employee')
         ELSE 'employee'
       END
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- 4) Backfill user_roles for any auth user that has none
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       (CASE
          WHEN lower(u.email) = 'lmodirv@gmail.com' THEN 'admin'
          WHEN COALESCE(u.raw_user_meta_data->>'role','employee') IN ('admin','manager','supervisor','employee','customer')
               THEN COALESCE(u.raw_user_meta_data->>'role','employee')
          ELSE 'employee'
        END)::public.app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
ON CONFLICT DO NOTHING;

-- 5) Ensure the master admin email is always admin
UPDATE public.profiles p
SET role = 'admin'
FROM auth.users u
WHERE u.id = p.user_id AND lower(u.email) = 'lmodirv@gmail.com' AND p.role <> 'admin';

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'lmodirv@gmail.com'
ON CONFLICT DO NOTHING;