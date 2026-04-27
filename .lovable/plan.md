# Audit-Backed Export System (Owner/Admin)

## Scope Lock

**This task only.** No refactor, no removal of any existing feature/route/policy. All changes are additive.

---

## A. Files to Change / Create

### New files
1. `supabase/migrations/<ts>_export_views_and_audit.sql` — single migration
2. `src/lib/exportCsv.ts` — shared CSV helper (download + escape)
3. `src/pages/OwnerExports.tsx` — central exports page (Services / Employees / Work Entries) for owner

### Updated files
1. `src/pages/OwnerShops.tsx` — already has Export shops CSV; add audit log call on suspend/unsuspend (already logged DB-side via `owner_set_shop_suspension`, just confirm — **no code change needed**, will verify only)
2. `src/pages/OwnerActivity.tsx` — wire existing Download button to real CSV export of `audit_logs` view
3. `src/components/OwnerSidebar.tsx` — add "Exports" entry pointing to `/owner/exports`
4. `src/App.tsx` — register `/owner/exports` route (lazy)
5. `src/pages/Services.tsx` — add "Export CSV" button (manager+ only, scoped to current shop)
6. `src/pages/Employees.tsx` — add "Export CSV" button (manager+ only, scoped to current shop)
7. `src/pages/Entries.tsx` (or `EmployeeApp.tsx` table — whichever is the work-entries page admins use) — add "Export CSV" button (manager+ only, scoped to current shop)

### Removals
**NONE.** (Empty as required by Execution Contract.)

---

## B. Migration Contents

### B.1 Export Views (security_invoker = true → respects RLS automatically, prevents cross-shop)

```sql
CREATE OR REPLACE VIEW public.v_services_export
WITH (security_invoker = true) AS
SELECT
  s.shop_id, s.id AS service_id, s.reference, s.name, s.name_ar, s.name_fr, s.name_en,
  s.category, s.price, s.duration, s.starting_from, s.is_active,
  s.description, s.created_at
FROM public.services s;

CREATE OR REPLACE VIEW public.v_employees_export
WITH (security_invoker = true) AS
SELECT
  e.shop_id, e.id AS employee_id, e.reference, e.name, e.phone,
  e.role, e.role_type, e.branch_id, b.name AS branch_name,
  e.is_active, e.hire_date, e.created_at
FROM public.employees e
LEFT JOIN public.branches b ON b.id = e.branch_id;

CREATE OR REPLACE VIEW public.v_work_entries_export
WITH (security_invoker = true) AS
SELECT
  o.shop_id, o.id AS order_id, o.reference, o.branch_id,
  o.customer_name, o.car_plate, o.car_type,
  o.employee_id, o.employee_name,
  o.services, o.total_price, o.status,
  o.start_at, o.expected_end_at, o.completed_at,
  o.notes, o.created_at
FROM public.orders o;

GRANT SELECT ON public.v_services_export, public.v_employees_export, public.v_work_entries_export TO authenticated;
```

> Because `security_invoker = true`, existing RLS on `services` / `employees` / `orders` (member-scoped + owner bypass) is enforced. **Cross-shop is impossible** unless caller is platform owner.

### B.2 Audit logging RPC for non-owner actors (manager/admin exports)

`audit_logs` currently has `INSERT` restricted to `is_owner()`. We need managers/admins to log their own export events without weakening that policy. Add a SECURITY DEFINER RPC:

```sql
CREATE OR REPLACE FUNCTION public.log_export_action(
  _shop_id uuid, _export_type text, _row_count int
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  -- Allow: owner, or shop manager of that shop
  IF NOT (public.is_owner() OR (_shop_id IS NOT NULL AND public.is_shop_manager(_shop_id))) THEN
    RAISE EXCEPTION 'Not allowed to export for this shop';
  END IF;
  IF _export_type NOT IN ('services','employees','work_entries','shops','audit_logs') THEN
    RAISE EXCEPTION 'Invalid export type';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs (actor_user_id, actor_email, action, target_type, target_id, metadata)
  VALUES (auth.uid(), v_email, 'export.csv', _export_type, _shop_id::text,
          jsonb_build_object('rows', _row_count, 'shop_id', _shop_id))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.log_export_action(uuid,text,int) TO authenticated;
```

### B.3 Index (non-destructive)
```sql
CREATE INDEX IF NOT EXISTS audit_logs_action_created_at_idx
  ON public.audit_logs(action, created_at DESC);
```

**No DROPs. No ALTER on existing tables. No data deletion.**

---

## C. Frontend Behavior

- `exportCsv.ts`: query a view filtered by current `shopId` (owner uses `null` filter to get all rows allowed by RLS), build CSV with proper escaping, trigger download, then call `supabase.rpc('log_export_action', { _shop_id, _export_type, _row_count })`.
- Buttons gated by role (manager/supervisor/admin/owner) using existing `useAuth`/role helpers.
- Owner Exports page: 3 cards (Services / Employees / Work Entries), each with shop selector (owner only) + Export button.

---

## D. Verification (will be produced after execution)

1. **Migration filename** (single new file).
2. **Diff Report**: Added / Updated / Removed (Removed = empty).
3. **DB before/after counts**:
   - `SELECT count(*) FROM v_services_export;`
   - `SELECT count(*) FROM v_employees_export;`
   - `SELECT count(*) FROM v_work_entries_export;`
   - `SELECT count(*) FROM audit_logs WHERE action='export.csv';` (before vs after a test export)
4. **Ready-to-run CSV SQL** (psql `\copy` snippets).
5. **Typecheck**: `tsc --noEmit` result.
6. **Permission test matrix**:

| Actor | Own-shop export | Cross-shop export | Audit row created |
|---|---|---|---|
| owner | PASS | PASS | PASS |
| shop manager/supervisor | PASS | FAIL (RLS blocks) | PASS |
| employee | FAIL (button hidden + RPC denies) | FAIL | n/a |

---

## Guardrails confirmed
- No deletion of any route, page, policy, or function.
- All inserts via `WITH CHECK` — handled by SECURITY DEFINER RPC + view security_invoker.
- No cross-shop leakage (RLS enforced by `security_invoker` views).
- Upsert semantics not needed (views + append-only audit rows).
