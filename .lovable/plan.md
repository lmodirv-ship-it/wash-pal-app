## Goal
Make the **Employee** role able to view services for their own shop, read-only and shop-scoped.

## Root cause
- Employees enter via `/employee` (`EmployeeApp`) which renders fullscreen with **no sidebar**, so there is no entry point to a Services page.
- `EmployeeApp` already calls `useApp().services`, but for many employees `services` is empty because either (a) `tenantShops` is empty for them so `currentShopId` is never set / shop UI gates them, or (b) RLS returns nothing because they have no `shop_members` row in any shop. RLS for `services` is `is_shop_member(shop_id)`, which is correct — invited employees become members and should see rows. The visible bug is mostly UX: no dedicated Services screen and no clear empty state.

## Plan

### 1. Add a dedicated Employee Services page (read-only)
- New file: `src/pages/EmployeeServices.tsx`.
- Reuses `useApp().services` (already shop-scoped via RLS).
- Shows only `isActive === true` services.
- Groups by category (standard / vip / extra / packs / motor) using same look as `EmployeeApp` cards, but **no selection, no add/edit/delete** — display only (name, price, duration, "starting from" badge).
- Search box + category tabs, RTL friendly.
- Empty state: "لا توجد خدمات متاحة في متجرك حالياً." with hint to contact the supervisor.
- Localized via `getServiceName` / i18n.

### 2. Wire route + guard
- In `src/App.tsx`, inside the existing employee fullscreen route group (`allowedRoles={["owner","employee","supervisor","manager"]}`), add:
  - `/employee/services` → `EmployeeServices`.
- Keep `/employee` unchanged.

### 3. Add a small top-bar / nav inside the Employee area
The employee shell has no sidebar, so add a slim header/nav inside `EmployeeApp` and `EmployeeServices`:
- Two pills: "تسجيل طلب" → `/employee`, "الخدمات" → `/employee/services`.
- Active state highlighted. Mobile-first, sticky top.
- Extract into `src/components/EmployeeTopNav.tsx` and use in both pages.

### 4. Sidebar (defense in depth)
- In `src/components/AppSidebar.tsx`, append a Services entry (`/employee/services`, `Droplets` icon) to `employeeItems`. Sidebar isn't rendered on `/employee/*` today, but this keeps things consistent if an employee ever lands on a layout route.

### 5. Backend / RLS verification (no changes expected)
Current `services` policies already satisfy the requirements:
- `services_select_member` USING `is_shop_member(shop_id)` → employee SELECT inside their shop only.
- `services_insert_member` / `services_update_member` / `services_delete_member` all gated by `is_shop_member`. To strictly block employees from writes (only supervisor/manager/owner), we will tighten **write** policies to `is_shop_manager(shop_id)` while keeping SELECT open to all members:
  - Drop `services_insert_member`, `services_update_member`, `services_delete_member`.
  - Recreate them with `is_shop_manager(shop_id)` (USING + WITH CHECK).
  - `services_select_member` and `services_owner_all` stay unchanged.
- This guarantees: employee can read, cannot write.

### 6. Empty-state diagnostics
If `services` is empty AND `tenantShops` is empty, show a clearer message in `EmployeeServices`:
- "لم يتم ربطك بأي متجر بعد. تواصل مع المشرف لقبول الدعوة."
This avoids the silent blank-page experience employees see today.

## Acceptance criteria mapping
1. Employee login → `/employee/services` opens. ✅
2. RLS `is_shop_member` ensures shop-scoped SELECT only. ✅
3. Cross-shop services hidden by RLS. ✅
4. Write policies tightened to `is_shop_manager` → employees blocked from create/edit/delete. ✅
5. New page is plain TSX reusing existing types → clean build. ✅

## Files touched
- **New**: `src/pages/EmployeeServices.tsx`, `src/components/EmployeeTopNav.tsx`
- **Edit**: `src/App.tsx`, `src/pages/EmployeeApp.tsx` (mount top nav), `src/components/AppSidebar.tsx`
- **Migration**: tighten `services` write policies to `is_shop_manager`
