
-- ============================================
-- 0. إضافة user_id لربط العملاء بحساباتهم
-- ============================================
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- ============================================
-- 1. SERVICES — Admin فقط للتعديل، الكل يقرأ
-- ============================================
DROP POLICY IF EXISTS "Allow all access to services" ON public.services;
DROP POLICY IF EXISTS "Anyone can read services" ON public.services;
DROP POLICY IF EXISTS "Admins manage services insert" ON public.services;
DROP POLICY IF EXISTS "Admins manage services update" ON public.services;
DROP POLICY IF EXISTS "Admins manage services delete" ON public.services;

CREATE POLICY "services_select_authenticated" ON public.services
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "services_insert_admin" ON public.services
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "services_update_admin" ON public.services
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "services_delete_admin" ON public.services
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 2. BRANCHES — قراءة للجميع المسجّلين، Admin فقط للإدارة
-- ============================================
DROP POLICY IF EXISTS "Allow all access to branches" ON public.branches;
DROP POLICY IF EXISTS "Authenticated read branches" ON public.branches;
DROP POLICY IF EXISTS "Admins manage branches" ON public.branches;

CREATE POLICY "branches_select_authenticated" ON public.branches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "branches_insert_admin" ON public.branches
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branches_update_admin" ON public.branches
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branches_delete_admin" ON public.branches
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. EMPLOYEES — Admin/Manager فقط
-- ============================================
DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated read employees" ON public.employees;
DROP POLICY IF EXISTS "Admins manage employees" ON public.employees;

CREATE POLICY "employees_select_staff" ON public.employees
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "employees_insert_admin_manager" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "employees_update_admin_manager" ON public.employees
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. CUSTOMERS — موظف يضيف ويقرأ، عميل يرى نفسه
-- ============================================
DROP POLICY IF EXISTS "Allow all access to customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated read customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admins update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins delete customers" ON public.customers;

CREATE POLICY "customers_select_staff" ON public.customers
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'employee')
  );
CREATE POLICY "customers_select_own" ON public.customers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_staff" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'employee')
  );
CREATE POLICY "customers_update_admin_manager" ON public.customers
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "customers_delete_admin" ON public.customers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 5. ORDERS — Employee ينشئ ويقرأ، Customer يرى طلباته
-- ============================================
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;

CREATE POLICY "orders_select_staff" ON public.orders
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'employee')
  );
CREATE POLICY "orders_select_own_customer" ON public.orders
  FOR SELECT TO authenticated USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );
CREATE POLICY "orders_insert_staff" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'employee')
  );
CREATE POLICY "orders_insert_own_customer" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );
CREATE POLICY "orders_update_admin_manager" ON public.orders
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "orders_delete_admin" ON public.orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 6. INVOICES — Employee قراءة وإضافة، Customer يرى فواتيره
-- ============================================
DROP POLICY IF EXISTS "Allow all access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated read invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins delete invoices" ON public.invoices;

CREATE POLICY "invoices_select_staff" ON public.invoices
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'employee')
  );
CREATE POLICY "invoices_select_own_customer" ON public.invoices
  FOR SELECT TO authenticated USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "invoices_insert_staff" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'employee')
  );
CREATE POLICY "invoices_update_admin_manager" ON public.invoices
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "invoices_delete_admin" ON public.invoices
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 7. EXPENSES — Admin/Manager فقط (مالية)
-- ============================================
DROP POLICY IF EXISTS "Admins manage expenses" ON public.expenses;
CREATE POLICY "expenses_all_admin_manager" ON public.expenses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ============================================
-- 8. SHOPS (B2B) — Admin/Manager فقط
-- ============================================
DROP POLICY IF EXISTS "Allow all access to shops" ON public.shops;
DROP POLICY IF EXISTS "Admins manage shops" ON public.shops;
CREATE POLICY "shops_select_admin_manager" ON public.shops
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "shops_insert_admin_manager" ON public.shops
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "shops_update_admin_manager" ON public.shops
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
CREATE POLICY "shops_delete_admin" ON public.shops
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 9. منع المستخدم من ترقية نفسه عبر profiles
-- ============================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "profiles_update_own_no_role" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- منع تغيير عمود role من خلال trigger
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_change ON public.profiles;
CREATE TRIGGER prevent_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();
