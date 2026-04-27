---
name: Role definitions and scope
description: Canonical definition of the 6 platform roles and their data access scope
type: feature
---
The platform has exactly 6 roles. Their meaning and scope are FIXED:

| Role | Meaning | Scope |
|---|---|---|
| owner | مالك المنصة بالكامل (platform owner) | Global. Full access to all shops. Uses isolated `/owner` console. |
| admin | مالك متجر واحد (single shop owner) | Scoped to their own `shop_id` only. NOT global. |
| supervisor | مشرف المتجر | Scoped to `shop_id`. Can manage shop team. |
| manager | Gérant / Manager | Scoped to `shop_id`. Operational management. |
| employee | موظف | Scoped to `shop_id`. Read-only on most data; can create orders. |
| customer | عميل | Sees only their own data (own customer row, own orders/invoices). |

Rules:
- Only `owner` is global. Every other role is shop-scoped via `is_shop_member` / `is_shop_manager`.
- `admin` is NOT a platform admin — they own one shop. Never grant `admin` global RLS access.
- Write permissions (INSERT/UPDATE/DELETE) for shop data should be limited to owner/admin/supervisor/manager (`is_shop_manager` covers this when the admin is the shop owner).
- Sidebar / routes:
  - owner → `/owner/*` (platform console)
  - admin/supervisor/manager → `/dashboard` and shop tools
  - employee → `/employee` (fullscreen, no sidebar) + `/employee/services`
  - customer → `/app`
