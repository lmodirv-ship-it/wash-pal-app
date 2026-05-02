# Project Memory

## Core
Brand: H&Lavage (Car wash management SaaS).
Tech stack: React, Vite, Tailwind, Supabase (Lovable Cloud), RTL Arabic UI, Cairo font.
Theme: deep black bg (#030308), glowing amber/yellow accents, neon sidebar.
Roles (FIXED, 6 total):
  - owner = مالك المنصة (global, /owner console only)
  - admin = مالك متجر واحد (shop-scoped, NOT global)
  - supervisor = مشرف المتجر (shop-scoped)
  - manager = Gérant (shop-scoped)
  - employee = موظف (shop-scoped, read-only on most)
  - customer = عميل (own data only)
Multi-tenant isolation: only `owner` has global RLS; all others scoped by `shop_id` via is_shop_member / is_shop_manager.
Owner console is fully isolated under `/owner/*` (legacy `/admin/*` redirects there).

## Memories
- [Role definitions](mem://features/role-definitions) — Canonical scope and meaning of the 6 platform roles
- [SaaS Architecture](mem://features/saas-architecture) — Multi-tenant: RLS, realtime, plan limits, notifications
- [Admin Authority](mem://features/admin-authority) — Shop-owner (admin) permissions and controls
- [Admin Camera Authentication](mem://features/admin-camera-auth) — Facial recognition for admin logins, intruder logs
- [Role-based Navigation](mem://features/role-based-navigation) — Post-login redirects per role
- [Business Requirements](mem://features/business-requirements) — Multi-branch, invoices, order states
- [B2B Subscriptions](mem://features/b2b-subscriptions) — Point-based shop subscriptions, expiration alerts
- [Services Page Logic](mem://features/services-page-logic) — Interactive service selection + instant invoice calc
- [Database Implementation](mem://tech/database-implementation) — Supabase: triggers, profiles, 6-digit references
- [Glossy Dark Theme](mem://style/glossy-dark-theme) — Visual identity tokens
- [Login Page Design](mem://ui/login-design) — Glassmorphism login, no role-specific buttons
- [Table Layout Conventions](mem://ui/table-layout-preference) — Standard column ordering (Ref, Name, Role, Date)
- [Owner Platform Controls](mem://features/owner-platform-controls) — App settings, feature flags, maintenance gate, read-only impersonation, audit triggers
