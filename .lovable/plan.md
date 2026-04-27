## Owner Dashboard PR1 Polish — Scope Locked

Polish the existing `/owner` (AdminDashboard) page only. No deletions. No changes to /owner/database (stays read-only). Reuses existing RPCs and the proven `OwnerShops` flow (already wires suspend/activate via `owner_set_shop_suspension` which writes to `audit_logs`).

### Files to change
- `src/pages/AdminDashboard.tsx` — replace mock KPIs with real DB-aggregated values, add date-range filter, CSV exports, "View shop" link, audit-logged actions.

### New files
- `src/components/DateRangeFilter.tsx` — reusable today/7d/30d/custom toolbar (uses existing `Calendar` shadcn component, `pointer-events-auto`).
- `src/hooks/useDashboardMetrics.ts` — single hook that loads + aggregates shops/subs/orders/members/invoices, scoped to the selected `[from, to]`.

### Potential removals
None.

---

### What gets fixed (1:1 with the request)

1. **Mock KPIs → real DB aggregates** (cards currently showing fake "Chauffeurs / Trajets / Livraison" labels):
   - `Total des demandes` → real count of `orders` in range.
   - `Trajets en cours` → `orders.status in ('waiting','in_progress')` in range.
   - `Livraison en attente` / `Livraison active` → **renamed** to `طلبات قيد الانتظار` and `طلبات اليوم` (real values from `orders`). The "delivery" wording was placeholder UI; replaced with meaningful car-wash metrics — no feature removed, only relabeled.
   - `Chauffeurs actifs` → renamed to `موظفون نشطون`, real `count(employees where is_active)`.
   - `MRR` → unchanged formula but range-aware (subs created in range OR active subs as of range end, depending on filter — defaulting to active-as-of-end).
   - `إجمالي المتاجر`, `النمو الشهري`, `اشتراكات السائقين/العملاء` → recomputed from real rows + range.
   - `Revenue from completed orders (range)` → new card replacing one placeholder.

2. **Global date-range filter**:
   - Toolbar at top: `اليوم | 7 أيام | 30 يوم | مخصص`. Custom opens a popover with two `Calendar` pickers (start/end).
   - Affects KPI grid, the 3 charts (revenue/shops/users), and Top Shops table.
   - Default: last 30 days. Persisted in component state (no URL sync needed for PR1).

3. **CSV exports for dashboard source tables**:
   - Single "تصدير" dropdown button next to date filter with options:
     - Shops (filtered) → `shops-YYYY-MM-DD.csv`
     - Orders (in range) → `orders-YYYY-MM-DD.csv`
     - Subscriptions (active) → `subscriptions-YYYY-MM-DD.csv`
     - Top Shops snapshot (current view) → `top-shops-YYYY-MM-DD.csv`
   - All routed through existing `rowsToCsv` + `downloadCsv` from `src/lib/exportCsv.ts`, then `logExport(...)` to write an `audit_logs` row (RPC `log_export_action` already enforces owner/manager check).

4. **Wire shops actions (activate / freeze / view)**:
   - In the "Top Shops" table, replace the static row with action buttons:
     - **عرض** → `Link to="/owner/shops?focus={shop.id}"` (existing OwnerShops page; we add a `?focus` highlight in this PR — single small effect to scroll/highlight the matching row).
     - **تجميد / تفعيل** → opens the same suspend dialog logic, but to keep this page lean we route the user to `/owner/shops?suspend={shop.id}` and OwnerShops auto-opens the dialog. Audit logging is already handled by `owner_set_shop_suspension` (writes `shop.suspend` / `shop.unsuspend` to `audit_logs`).
   - This avoids duplicating the suspend dialog and keeps a single source of truth.

5. **DB Center stays read-only** — no changes to `/owner/database`.

---

### Queries used (all SELECT, RLS-enforced by `is_owner()`)

```sql
-- Shops (with suspended flag for action wiring)
select id, name, created_at, suspended from shops;

-- Subscriptions
select id, shop_id, plan, status, monthly_price, current_period_end, created_at
from subscriptions;

-- Orders within range
select id, shop_id, total_price, status, created_at, completed_at
from orders
where created_at >= :from and created_at < :to;

-- Members within range (for users-by-month chart)
select user_id, shop_id, created_at from shop_members;

-- Employees (for active-employees KPI)
select id, shop_id, is_active from employees where is_active = true;
```

CSV exports: same selects above filtered by range, then `rowsToCsv` → `downloadCsv` → `log_export_action` RPC.

---

### Acceptance / verification

- KPI numbers match `psql` counts for a seeded shop (cross-checked via `supabase--read_query`).
- Changing the date range immediately re-renders KPIs + all 3 charts + Top Shops.
- Each CSV download produces an `audit_logs` row with `action='export.csv'`, correct `target_type`, and row count in `metadata`.
- Suspending a shop from Top Shops links to OwnerShops, opens dialog, on confirm writes `shop.suspend` to `audit_logs` (existing behavior, just newly reachable from the dashboard).
- `npm run build` + `tsc --noEmit` pass.
- No existing route, button, sidebar entry, or table is removed.

### Deliverables
- Changed file list.
- The exact SQL queries above.
- Before/after screenshots of the dashboard (desktop 1330×890 + mobile).
- `tsc --noEmit` + build output.
- Sample `audit_logs` row from one export and one suspend action.