-- 1) Overrides table
CREATE TABLE IF NOT EXISTS public.employee_service_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_eso_employee ON public.employee_service_overrides(employee_id);
CREATE INDEX IF NOT EXISTS idx_eso_shop ON public.employee_service_overrides(shop_id);

CREATE TRIGGER trg_eso_updated_at
  BEFORE UPDATE ON public.employee_service_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Link employees to a user account so we can resolve "current employee row" from auth.uid()
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

-- 3) Helper: resolve the current user's employee_id within a given shop
CREATE OR REPLACE FUNCTION public.current_employee_id(_shop_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.employees
   WHERE shop_id = _shop_id
     AND (user_id = auth.uid())
   LIMIT 1;
$$;

-- 4) Effective services function: returns services visible to a given employee
CREATE OR REPLACE FUNCTION public.effective_services_for_employee(_employee_id uuid)
RETURNS SETOF public.services
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.*
  FROM public.services s
  JOIN public.employees e ON e.id = _employee_id
  WHERE s.shop_id = e.shop_id
    AND s.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.employee_service_overrides o
       WHERE o.employee_id = _employee_id
         AND o.service_id = s.id
         AND o.enabled = false
    );
$$;

-- 5) RLS on overrides
ALTER TABLE public.employee_service_overrides ENABLE ROW LEVEL SECURITY;

-- Owner: global
CREATE POLICY eso_owner_all ON public.employee_service_overrides
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Shop managers (admin/supervisor/manager via is_shop_manager) can read+write inside their shop
CREATE POLICY eso_manager_select ON public.employee_service_overrides
  FOR SELECT TO authenticated
  USING (public.is_shop_manager(shop_id));

CREATE POLICY eso_manager_insert ON public.employee_service_overrides
  FOR INSERT TO authenticated
  WITH CHECK (public.is_shop_manager(shop_id));

CREATE POLICY eso_manager_update ON public.employee_service_overrides
  FOR UPDATE TO authenticated
  USING (public.is_shop_manager(shop_id))
  WITH CHECK (public.is_shop_manager(shop_id));

CREATE POLICY eso_manager_delete ON public.employee_service_overrides
  FOR DELETE TO authenticated
  USING (public.is_shop_manager(shop_id));

-- Employees can READ only the overrides that target their own employee row
CREATE POLICY eso_employee_self_select ON public.employee_service_overrides
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid() AND shop_id = employee_service_overrides.shop_id
    )
  );

-- 6) Bind MOHAMMED to the lavagenizar shop (Track A)
DO $$
DECLARE
  v_user uuid := 'bc6b0d0b-0572-42d6-b510-638459d0a948';
  v_shop uuid := '4978deea-23c3-4f93-b4c6-55b9c939b918';
  v_branch uuid;
BEGIN
  -- Ensure shop_members row
  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (v_shop, v_user, 'employee')
  ON CONFLICT DO NOTHING;

  -- Pick a branch (first active)
  SELECT id INTO v_branch FROM public.branches
   WHERE shop_id = v_shop AND is_active = true
   ORDER BY created_at LIMIT 1;

  -- Create branch if none exists
  IF v_branch IS NULL THEN
    INSERT INTO public.branches (shop_id, name, address, phone, is_active)
    VALUES (v_shop, 'الفرع الرئيسي', '-', '-', true)
    RETURNING id INTO v_branch;
  END IF;

  -- Ensure an employees row linked to this user
  IF NOT EXISTS (SELECT 1 FROM public.employees WHERE user_id = v_user AND shop_id = v_shop) THEN
    INSERT INTO public.employees (shop_id, branch_id, name, phone, role, role_type, is_active, user_id)
    VALUES (v_shop, v_branch, 'MOHAMMED', '-', 'موظف', 'employee', true, v_user);
  ELSE
    UPDATE public.employees SET is_active = true WHERE user_id = v_user AND shop_id = v_shop;
  END IF;
END $$;
