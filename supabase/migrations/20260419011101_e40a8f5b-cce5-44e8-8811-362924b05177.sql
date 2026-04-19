
-- SERVICES
DROP POLICY IF EXISTS "Allow all access to services" ON public.services;
CREATE POLICY "Anyone can read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins manage services insert" ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins manage services update" ON public.services FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins manage services delete" ON public.services FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- BRANCHES
DROP POLICY IF EXISTS "Allow all access to branches" ON public.branches;
CREATE POLICY "Authenticated read branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage branches" ON public.branches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- EMPLOYEES
DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;
CREATE POLICY "Authenticated read employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage employees" ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- CUSTOMERS
DROP POLICY IF EXISTS "Allow all access to customers" ON public.customers;
CREATE POLICY "Authenticated read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins update customers" ON public.customers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins delete customers" ON public.customers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ORDERS
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;
CREATE POLICY "Authenticated read orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update orders" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INVOICES
DROP POLICY IF EXISTS "Allow all access to invoices" ON public.invoices;
CREATE POLICY "Authenticated read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins update invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins delete invoices" ON public.invoices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- SHOPS (B2B)
DROP POLICY IF EXISTS "Allow all access to shops" ON public.shops;
CREATE POLICY "Admins manage shops" ON public.shops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
