-- =========================================
-- 1) shop_members table (user ↔ shop membership)
-- =========================================
CREATE TABLE public.shop_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('supervisor','manager','employee')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);

CREATE INDEX idx_shop_members_user_id ON public.shop_members(user_id);
CREATE INDEX idx_shop_members_shop_id ON public.shop_members(shop_id);

ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 2) Helper functions (SECURITY DEFINER, prevent recursion)
-- =========================================
CREATE OR REPLACE FUNCTION public.is_shop_member(_shop_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = _shop_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.shops
    WHERE id = _shop_id AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_shop_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()
  UNION
  SELECT id FROM public.shops WHERE owner_id = auth.uid();
$$;

-- shop_members RLS
CREATE POLICY "shop_members_admin_all" ON public.shop_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "shop_members_select_own" ON public.shop_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

CREATE POLICY "shop_members_owner_manage" ON public.shop_members FOR ALL TO authenticated
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- =========================================
-- 3) Pick default shop "H&Lavage" (already created in prev migration)
-- =========================================
DO $$
DECLARE
  default_shop_id uuid;
BEGIN
  SELECT id INTO default_shop_id FROM public.shops WHERE name = 'H&Lavage' ORDER BY created_at LIMIT 1;
  IF default_shop_id IS NULL THEN
    RAISE EXCEPTION 'Default shop H&Lavage not found. Run previous migration first.';
  END IF;

  -- Add shop_id to all core tables (nullable first, backfill, then NOT NULL)
  ALTER TABLE public.services   ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
  ALTER TABLE public.employees  ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
  ALTER TABLE public.customers  ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
  ALTER TABLE public.orders     ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
  ALTER TABLE public.invoices   ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
  ALTER TABLE public.expenses   ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
  ALTER TABLE public.branches   ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;

  UPDATE public.services  SET shop_id = default_shop_id WHERE shop_id IS NULL;
  UPDATE public.employees SET shop_id = default_shop_id WHERE shop_id IS NULL;
  UPDATE public.customers SET shop_id = default_shop_id WHERE shop_id IS NULL;
  UPDATE public.orders    SET shop_id = default_shop_id WHERE shop_id IS NULL;
  UPDATE public.invoices  SET shop_id = default_shop_id WHERE shop_id IS NULL;
  UPDATE public.expenses  SET shop_id = default_shop_id WHERE shop_id IS NULL;
  UPDATE public.branches  SET shop_id = default_shop_id WHERE shop_id IS NULL;

  ALTER TABLE public.services  ALTER COLUMN shop_id SET NOT NULL;
  ALTER TABLE public.employees ALTER COLUMN shop_id SET NOT NULL;
  ALTER TABLE public.customers ALTER COLUMN shop_id SET NOT NULL;
  ALTER TABLE public.orders    ALTER COLUMN shop_id SET NOT NULL;
  ALTER TABLE public.invoices  ALTER COLUMN shop_id SET NOT NULL;
  ALTER TABLE public.expenses  ALTER COLUMN shop_id SET NOT NULL;
  ALTER TABLE public.branches  ALTER COLUMN shop_id SET NOT NULL;

  -- Auto-add owner as supervisor in shop_members for default shop
  INSERT INTO public.shop_members (shop_id, user_id, role)
  SELECT id, owner_id, 'supervisor' FROM public.shops WHERE id = default_shop_id
  ON CONFLICT DO NOTHING;
END $$;

CREATE INDEX idx_services_shop_id  ON public.services(shop_id);
CREATE INDEX idx_employees_shop_id ON public.employees(shop_id);
CREATE INDEX idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX idx_orders_shop_id    ON public.orders(shop_id);
CREATE INDEX idx_invoices_shop_id  ON public.invoices(shop_id);
CREATE INDEX idx_expenses_shop_id  ON public.expenses(shop_id);
CREATE INDEX idx_branches_shop_id  ON public.branches(shop_id);

-- =========================================
-- 4) Drop old RLS policies and recreate with shop isolation
-- =========================================

-- SERVICES
DROP POLICY IF EXISTS services_select_authenticated ON public.services;
DROP POLICY IF EXISTS services_insert_admin ON public.services;
DROP POLICY IF EXISTS services_update_admin ON public.services;
DROP POLICY IF EXISTS services_delete_admin ON public.services;

CREATE POLICY "services_admin_all" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "services_select_member" ON public.services FOR SELECT TO authenticated
  USING (public.is_shop_member(shop_id));
CREATE POLICY "services_insert_member" ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.is_shop_member(shop_id));
CREATE POLICY "services_update_member" ON public.services FOR UPDATE TO authenticated
  USING (public.is_shop_member(shop_id)) WITH CHECK (public.is_shop_member(shop_id));
CREATE POLICY "services_delete_member" ON public.services FOR DELETE TO authenticated
  USING (public.is_shop_member(shop_id));

-- EMPLOYEES
DROP POLICY IF EXISTS employees_select_staff ON public.employees;
DROP POLICY IF EXISTS employees_insert_admin_manager ON public.employees;
DROP POLICY IF EXISTS employees_update_admin_manager ON public.employees;
DROP POLICY IF EXISTS employees_delete_admin ON public.employees;

CREATE POLICY "employees_admin_all" ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "employees_member_all" ON public.employees FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id))
  WITH CHECK (public.is_shop_member(shop_id));

-- CUSTOMERS
DROP POLICY IF EXISTS customers_select_staff ON public.customers;
DROP POLICY IF EXISTS customers_select_own ON public.customers;
DROP POLICY IF EXISTS customers_insert_staff ON public.customers;
DROP POLICY IF EXISTS customers_update_admin_manager ON public.customers;
DROP POLICY IF EXISTS customers_delete_admin ON public.customers;

CREATE POLICY "customers_admin_all" ON public.customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "customers_select_own" ON public.customers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "customers_member_all" ON public.customers FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id))
  WITH CHECK (public.is_shop_member(shop_id));

-- ORDERS
DROP POLICY IF EXISTS orders_select_staff ON public.orders;
DROP POLICY IF EXISTS orders_select_own_customer ON public.orders;
DROP POLICY IF EXISTS orders_insert_staff ON public.orders;
DROP POLICY IF EXISTS orders_insert_own_customer ON public.orders;
DROP POLICY IF EXISTS orders_update_admin_manager ON public.orders;
DROP POLICY IF EXISTS orders_delete_admin ON public.orders;

CREATE POLICY "orders_admin_all" ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "orders_select_own_customer" ON public.orders FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));
CREATE POLICY "orders_member_all" ON public.orders FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id))
  WITH CHECK (public.is_shop_member(shop_id));

-- INVOICES
DROP POLICY IF EXISTS invoices_select_staff ON public.invoices;
DROP POLICY IF EXISTS invoices_select_own_customer ON public.invoices;
DROP POLICY IF EXISTS invoices_insert_staff ON public.invoices;
DROP POLICY IF EXISTS invoices_update_admin_manager ON public.invoices;
DROP POLICY IF EXISTS invoices_delete_admin ON public.invoices;

CREATE POLICY "invoices_admin_all" ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "invoices_select_own_customer" ON public.invoices FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())));
CREATE POLICY "invoices_member_all" ON public.invoices FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id))
  WITH CHECK (public.is_shop_member(shop_id));

-- EXPENSES
DROP POLICY IF EXISTS expenses_all_admin_manager ON public.expenses;

CREATE POLICY "expenses_admin_all" ON public.expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "expenses_member_all" ON public.expenses FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id))
  WITH CHECK (public.is_shop_member(shop_id));

-- BRANCHES
DROP POLICY IF EXISTS branches_select_authenticated ON public.branches;
DROP POLICY IF EXISTS branches_insert_admin ON public.branches;
DROP POLICY IF EXISTS branches_update_admin ON public.branches;
DROP POLICY IF EXISTS branches_delete_admin ON public.branches;

CREATE POLICY "branches_admin_all" ON public.branches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "branches_member_all" ON public.branches FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id))
  WITH CHECK (public.is_shop_member(shop_id));

-- =========================================
-- 5) Auto-add shop owner as supervisor in shop_members on shop creation
-- =========================================
CREATE OR REPLACE FUNCTION public.add_owner_as_supervisor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'supervisor')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER shops_add_owner_member
  AFTER INSERT ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_supervisor();