---
name: Owner Console - Platform Admin Features
description: App settings, feature flags, impersonation (read-only), maintenance gate, and audit logging on /owner console
type: feature
---
The Owner Console (/owner/*) has these platform-level controls:

## Tables
- `app_settings` (singleton, id=1): maintenance_mode, maintenance_message, signup_enabled, welcome_message, brand_logo_url, brand_primary_color
- `feature_flags`: key/label/category/enabled. Categories: modules, communication, security, auth, general
- `impersonation_sessions`: read-only audit trail of owner viewing a shop

## Hooks & components
- `useAppSettings()`, `useFeatureFlags()`, `useFeatureEnabled(key)` in `src/hooks/useAppSettings.ts`
- `<MaintenanceGate>` blocks all non-owners when maintenance_mode is on (wraps Routes in App.tsx)
- `<ImpersonationBanner>` sticky purple banner when an impersonation session is active
- `ImpersonationProvider` context — `start(shopId, name, reason)` / `stop()` / `isActive`
- Read-only impersonation: backend RPC `owner_start_impersonation` / `owner_end_impersonation` log to `audit_logs`. The UI does NOT actually switch the auth user — it just records the intent and shows the banner. Future enhancement: filter shop-scoped queries by impersonation.shopId when active.

## Auto-audit triggers
- Updates to `app_settings` and any change to `feature_flags` are logged automatically into `audit_logs` with old/new values.

## Pages
- `/owner/settings` — full settings + feature flags editor (replaces previous "coming soon" stub)
- `/owner/shops` — has new "مشاهدة" button per shop to start impersonation
