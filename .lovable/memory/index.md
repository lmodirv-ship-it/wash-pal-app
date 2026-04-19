# Memory: index.md
Updated: now

# Project Memory

## Core
Brand: H&Lavage (Car wash management system).
Tech stack: React, Supabase (PostgreSQL).
UI: Arabic + French (i18n via react-i18next), RTL/LTR auto-switch, Cairo font.
Roles: Admin, Supervisor, Employee, Customer. Admin has master control.
**Master admin email: lmodirv@gmail.com — IMMUTABLE, never allow change.**

## Memories
- [Master Admin Account](mem://constraints/admin-account) — Immutable admin email lmodirv@gmail.com, never editable
- [Glossy Dark Theme](mem://style/glossy-dark-theme) — Visual identity: deep black bg (#030308), glowing 3D buttons (#facc15), neon sidebar
- [Login Page Design](mem://ui/login-design) — Unified glassmorphism login form, no role-specific buttons
- [Table Layout Conventions](mem://ui/table-layout-preference) — Standardized horizontal tables with specific column ordering (Ref, Name, Role, Date)
- [Database Implementation](mem://tech/database-implementation) — Supabase details: auto-confirm auth, triggers for profiles & 6-digit references
- [Business Requirements](mem://features/business-requirements) — Multi-branch, invoices, order states (waiting, in progress, completed)
- [B2B Subscriptions](mem://features/b2b-subscriptions) — Point-based shop subscriptions with color-coded expiration alerts
- [Admin Authority](mem://features/admin-authority) — Master admin permissions, user/role management, service/price controls
- [Admin Camera Authentication](mem://features/admin-camera-auth) — Mandatory facial recognition for admin logins, logs intruders
- [Role-based Navigation](mem://features/role-based-navigation) — Post-login redirects: Employees/Customers to Services, Admins to Dashboard
- [Services Page Logic](mem://features/services-page-logic) — Interactive service selection and instant invoice calculation
