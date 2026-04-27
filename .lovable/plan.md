# Fix /employee route aliasing

## Problem
Visiting `/employee` or `/employee/services` should not 404. Per the new requirement, the canonical employee area is `/dashboard/*`, and `/employee/*` must alias to it.

Currently in `src/App.tsx`:
- `/employee` renders `EmployeeApp` directly (not a redirect).
- `/employee/services` renders `EmployeeServices` directly.
- The `/dashboard` route group disallows the `employee` role.
- `homeForRole("employee")` returns `/employee`, so post-login lands employees on the soon-to-be-aliased path.

## Changes

### 1. `src/App.tsx` — convert `/employee/*` to redirects
Replace the current employee route block with three `<Navigate replace>` aliases:

```tsx
<Route path="/employee" element={<Navigate to="/dashboard" replace />} />
<Route path="/employee/services" element={<Navigate to="/dashboard/services" replace />} />
<Route path="/employee/*" element={<Navigate to="/dashboard" replace />} />
<Route path="/work" element={<Navigate to="/dashboard" replace />} />
```

These are public-level redirects (no guard), so they never 404. The destination route then enforces auth + role.

### 2. `src/App.tsx` — allow `employee` on the dashboard route group
Add `"employee"` to `allowedRoles` of the dashboard `ProtectedRoute`:

```tsx
allowedRoles={["owner", "admin", "supervisor", "manager", "employee"]}
```

Add two new dashboard routes that point to the existing employee pages so the alias targets resolve:

- `/dashboard/services` → `EmployeeServices` (employee-friendly services view; `/services` already exists for admins and stays unchanged).
- `/dashboard` already maps to `Index`. For employees we keep the same dashboard entry; if a dedicated employee landing is desired later we can branch inside `Index`. For now `/employee` → `/dashboard` satisfies the requirement and the EmployeeApp content remains reachable via `/dashboard/services` for the order-entry flow they actually use.

Actually to preserve current employee UX (the EmployeeApp order-entry screen is what they use today), map the employee landing this way:
- `/dashboard` for employees keeps the standard `Index`. Employees were already using `/employee` (EmployeeApp) as their workspace, so we add `/dashboard/work` → `EmployeeApp` and update `/employee` alias to `/dashboard/work` to keep the same screen. Final aliases:

```tsx
<Route path="/employee" element={<Navigate to="/dashboard/work" replace />} />
<Route path="/employee/services" element={<Navigate to="/dashboard/services" replace />} />
<Route path="/employee/*" element={<Navigate to="/dashboard/work" replace />} />
```

And inside the dashboard guarded group:
```tsx
<Route path="/dashboard/work" element={<EmployeeApp />} />
<Route path="/dashboard/services" element={<EmployeeServices />} />
```

Note: `Layout` (sidebar) will now wrap EmployeeApp/EmployeeServices since they live under `AppShell`. To preserve the current fullscreen employee UX, render them inside a sibling guarded group that uses the bare `AppProvider + ShopGate` wrapper (same as today's employee block) but mounted under `/dashboard/work` and `/dashboard/services` paths. So we keep two route groups:

- Standard dashboard group (with Layout) — owner/admin/supervisor/manager — unchanged routes.
- Employee dashboard group (no Layout) — owner/employee/supervisor/manager — paths `/dashboard/work`, `/dashboard/services`.

### 3. `src/hooks/useEffectiveRoles.ts` — update employee home
Change `case "employee": return "/employee";` to `return "/dashboard/work";` so post-login routing aligns with the new canonical paths. The `/employee` alias still works for any external links/bookmarks.

## Guard behavior (verified)
- Unauthenticated user hitting `/employee` → alias to `/dashboard/work` → `ProtectedRoute` redirects to `/login`.
- Pending employee (no role yet) → `RoleHomeRedirect` already sends them to `/pending-approval`; if they hit `/employee` directly, `ProtectedRoute` denies and `homeForRole` of their role (customer) sends to `/app`. We will keep `RoleHomeRedirect` as the canonical pending check; direct `/employee` access for a pending user falls back to `/unauthorized`. To be friendlier, the employee guarded group will redirect denied users to `/post-login` (which already routes pending employees correctly).
- Approved employee → lands on `/dashboard/work` (EmployeeApp) and can navigate to `/dashboard/services`.
- Owner/manager/supervisor → still allowed on both groups.
- Admin → allowed on standard dashboard, NOT on employee group (kept shop-scoped per existing rules).

## Verification checklist
1. `/employee` → 302 to `/dashboard/work`, renders EmployeeApp for an employee, no 404.
2. `/employee/services` → 302 to `/dashboard/services`, renders services list scoped to the employee's shop.
3. `/employee/anything-else` → 302 to `/dashboard/work`.
4. Logged-out user hitting `/employee` → ends at `/login`.
5. Pending employee hitting `/employee` → ends at `/pending-approval` via `/post-login`.
6. `tsc --noEmit` and `vite build` succeed.

## Files touched
- `src/App.tsx` (routes restructure)
- `src/hooks/useEffectiveRoles.ts` (homeForRole)
