-- 1) Rename current shops table to b2b_partners (preserves all data + RLS)
ALTER TABLE public.shops RENAME TO b2b_partners;

-- Rename existing policies on b2b_partners to reflect new name
ALTER POLICY "shops_select_admin_manager" ON public.b2b_partners RENAME TO "b2b_partners_select_admin_manager";
ALTER POLICY "shops_insert_admin_manager" ON public.b2b_partners RENAME TO "b2b_partners_insert_admin_manager";
ALTER POLICY "shops_update_admin_manager" ON public.b2b_partners RENAME TO "b2b_partners_update_admin_manager";
ALTER POLICY "shops_delete_admin" ON public.b2b_partners RENAME TO "b2b_partners_delete_admin";

-- 2) Create new shops table (multi-tenant)
CREATE TABLE public.shops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX idx_shops_created_by ON public.shops(created_by);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- RLS: super admin full access
CREATE POLICY "shops_admin_all"
  ON public.shops FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: owner can read their shop
CREATE POLICY "shops_select_owner"
  ON public.shops FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS: owner can update their shop
CREATE POLICY "shops_update_owner"
  ON public.shops FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- RLS: any authenticated user can create a shop (becomes owner + creator)
CREATE POLICY "shops_insert_self"
  ON public.shops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by AND auth.uid() = owner_id);

-- updated_at trigger
CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Create default shop "H&Lavage" owned by first admin (or NULL-safe placeholder)
DO $$
DECLARE
  admin_user_id uuid;
  default_shop_id uuid;
BEGIN
  SELECT user_id INTO admin_user_id
  FROM public.user_roles
  WHERE role = 'admin'::app_role
  ORDER BY created_at
  LIMIT 1;

  -- If no admin exists, fall back to any auth user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  END IF;

  -- Only create if we have a user to own it
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.shops (name, owner_id, created_by)
    VALUES ('H&Lavage', admin_user_id, admin_user_id)
    RETURNING id INTO default_shop_id;

    -- 4) Add shop_id to b2b_partners and link existing rows
    ALTER TABLE public.b2b_partners ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL;
    UPDATE public.b2b_partners SET shop_id = default_shop_id WHERE shop_id IS NULL;
    CREATE INDEX idx_b2b_partners_shop_id ON public.b2b_partners(shop_id);
  ELSE
    -- No users yet: just add the column without backfill
    ALTER TABLE public.b2b_partners ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL;
    CREATE INDEX idx_b2b_partners_shop_id ON public.b2b_partners(shop_id);
  END IF;
END $$;