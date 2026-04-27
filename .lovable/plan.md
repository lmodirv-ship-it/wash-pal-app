# PR1 — Owner Control Center Foundation + Services Cap → 60

## Scope Lock
**This PR only.** No work outside `/owner/*` and the services-cap subsystem. No deletion of existing features.

---

## A. Current State Audit (what already exists, will NOT be re-built)

| Feature | Status | Action |
|---|---|---|
| `/owner/*` routes wrapped in `ProtectedRoute allowedRoles={["owner"]}` + `OwnerShell` | ✅ exists | Keep — add page-level `is_owner()` re-check |
| `OwnerSidebar` with 13 entries | ✅ exists | Tweak labels only (rename "سجل الأدوار" → "Role Audit Logs"), remove zero items |
| `OwnerShops` (list/filter/suspend/CSV) | ✅ exists | Add step-up confirmation modal; already audit-logged via `owner_set_shop_suspension` |
| `AdminUsers` mounted at `/owner/users` | ✅ exists | Add step-up modal for role changes |
| `OwnerSecurity` (login_attempts) | ✅ exists | Add CSV export button |
| `OwnerActivity` (audit_logs) | ✅ exists | No change |
| `RoleAuditLogs` mounted at `/owner/audit-logs` | ✅ exists | Rename route alias `/owner/role-audit-logs` → same page |
| `OwnerDatabase` (read-only) | ✅ exists | No change |
| `OwnerNotifications` (in-app broadcast) | ✅ exists via `owner_broadcast` RPC | No change |
| `audit_logs` table + `log_owner_action` RPC | ✅ exists | Add `ip` + `user_agent` capture from client |
| `AdminDashboard` at `/owner` (KPIs) | ✅ exists | No change |

**Verdict**: PR1 is ~85% complete from prior work. This PR finishes the gaps + adds the 60-services cap.

---

## B. Files to Change / Create

### New files
1. `src/components/StepUpConfirm.tsx` — reusable confirmation modal (typed-phrase + reason; calls audit RPC)
2. `src/lib/clientMeta.ts` — captures `user_agent` (and best-effort IP via `https://api.ipify.org` cached per session)
3. `supabase/migrations/<ts>_services_cap_60_and_audit_meta.sql` — single migration:
   - `enforce_service_limit()` trigger on `services` (max 60 active per shop, owner bypass)
   - Indexes: `services(shop_id, is_active)`, `services(shop_id, category)`, `services(shop_id, updated_at DESC)`
   - Add `updated_at` column to `services` if missing + `update_updated_at_column` trigger
   - Extend `log_owner_action` to accept `_ip` and `_user_agent` params (overload-safe new signature)

### Updated files
1. `src/components/OwnerSidebar.tsx` — rename labels to match spec (Dashboard / Shops / Users & Roles / Security / Role Audit Logs / Subscriptions / Notifications / Database / Settings); the sidebar already excludes any "shop services management" — verified
2. `src/pages/OwnerShops.tsx` — wrap suspend/unsuspend with `<StepUpConfirm>` (already typed-confirmation present; harmonize)
3. `src/pages/AdminUsers.tsx` — wrap role-change with `<StepUpConfirm>` + call `log_owner_action` with ip/UA
4. `src/pages/AdminSubscriptions.tsx` — wrap critical update (plan/status change) with `<StepUpConfirm>`
5. `src/pages/OwnerSecurity.tsx` — add CSV export button (login_attempts) + audit via `log_export_action`
6. `src/pages/OwnerExports.tsx` — add 2 more tiles: `users` (admin-style export of profiles+roles) and `subscriptions`. Add `login_attempts` + `role_audit_logs` tiles
7. `src/components/OwnerShell.tsx` — add page-level `is_owner()` defense-in-depth (RPC check, redirect to `/dashboard` if false)
8. `src/App.tsx` — alias `/owner/role-audit-logs` → existing `RoleAuditLogs`
9. `src/pages/Services.tsx` — show "X / 60" counter; show friendly toast on cap hit; ensure category tabs + search + pagination work for 60 items (grid currently is fine; will add page-size 20 if list grows past 24)
10. `src/pages/EmployeeServices.tsx` & employee selection components — verify scoped query `eq('shop_id', currentShopId).eq('is_active', true)` (already correct; will confirm and add unit-style smoke check)

### Removals
**NONE.** (Empty as required by Execution Contract.)

---

## C. Migration Contents (single file)

```sql
-- 1) services.updated_at + trigger (idempotent)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Indexes for fast scoped listing
CREATE INDEX IF NOT EXISTS services_shop_active_idx     ON public.services (shop_id, is_active);
CREATE INDEX IF NOT EXISTS services_shop_category_idx   ON public.services (shop_id, category);
CREATE INDEX IF NOT EXISTS services_shop_updated_at_idx ON public.services (shop_id, updated_at DESC);

-- 3) Cap = 60 active services per shop
CREATE OR REPLACE FUNCTION public.enforce_service_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_count int;
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_owner() THEN RETURN NEW; END IF;
  IF NEW.is_active = false THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO current_count
    FROM public.services
   WHERE shop_id = NEW.shop_id AND is_active = true
     AND (TG_OP = 'INSERT' OR id <> NEW.id);
  IF current_count >= 60 THEN
    RAISE EXCEPTION 'تم بلوغ الحد الأقصى للخدمات (60) لكل متجر. يرجى تعطيل خدمات قديمة أولاً.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS services_enforce_limit ON public.services;
CREATE TRIGGER services_enforce_limit
  BEFORE INSERT OR UPDATE OF is_active, shop_id ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.enforce_service_limit();

-- 4) Extended audit logger with IP + UA (additive overload — keeps existing function)
CREATE OR REPLACE FUNCTION public.log_owner_action_v2(
  _action text, _target_type text, _target_id text,
  _old_value jsonb DEFAULT NULL, _new_value jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT NULL, _ip text DEFAULT NULL, _user_agent text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_email text;
BEGIN
  IF NOT public.is_owner() THEN RAISE EXCEPTION 'Only platform owner can log owner actions'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs
    (actor_user_id, actor_email, action, target_type, target_id,
     old_value, new_value, metadata, ip_address, user_agent)
  VALUES (auth.uid(), v_email, _action, _target_type, _target_id,
          _old_value, _new_value, _metadata, _ip, _user_agent)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.log_owner_action_v2(text,text,text,jsonb,jsonb,jsonb,text,text) TO authenticated;
```

**No DROP, no destructive ALTER, no data deletion.**

---

## D. Step-Up Confirmation UX

`<StepUpConfirm>` modal:
- Shows the target object summary + a red warning banner
- Requires typing a confirmation phrase (e.g. shop name, user email, or "CONFIRM")
- Optional reason textarea (sent into `metadata.reason`)
- Disabled CTA until the phrase matches exactly
- On confirm: runs the action, then calls `log_owner_action_v2(...)` with `ip` + `user_agent` from `clientMeta.ts`

Used in:
- `OwnerShops` → suspend/unsuspend (already has typed confirmation; will harmonize via the new component)
- `AdminUsers` → grant/revoke role
- `AdminSubscriptions` → change plan / change status

---

## E. Services Cap = 60

**Backend**: trigger above (rejects 61st active service with friendly Arabic message).
**Frontend** (`Services.tsx`):
- Header counter: `{activeCount} / 60 خدمة فعّالة`
- Add button disabled when `activeCount >= 60` + tooltip "بلغت الحد الأقصى (60). عطّل خدمة لإضافة جديدة."
- Toast on RPC error code `P0001` shows the DB message
- Search + category tabs already exist; add simple pagination (20/page) when total > 24 items
- Mobile: existing card grid retained

**Employee path**: verified queries are `WHERE shop_id = $1 AND is_active = true` — covered by new indexes. No cross-shop access (RLS).

---

## F. Verification Plan (after execution)

| Check | Method |
|---|---|
| owner can access all `/owner/*` pages | Manual nav (preview) |
| non-owner blocked → `/dashboard` | Route guard + page guard test |
| Sensitive action requires step-up | Try suspend/role-change without typing |
| Audit row written with ip + ua | `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;` |
| CSV exports work for shops/users/role_audit_logs/subscriptions/login_attempts | Click each → file downloads + audit row appears |
| 60-cap rejects 61st service | Insert test via SQL + UI |
| Indexes created | `\d+ services` |
| Build + typecheck | `bunx tsc --noEmit` |

### Pass/Fail role matrix
| Actor | `/owner` | Suspend shop | Change role | Export CSV |
|---|---|---|---|---|
| owner | PASS | PASS | PASS | PASS |
| admin (non-owner) | FAIL→/dashboard | FAIL | FAIL | FAIL |
| supervisor/manager/employee/customer | FAIL→/dashboard | FAIL | FAIL | FAIL |

---

## G. Out of Scope (for later PRs)
- PR2: `/join-shop` flow, `employee_join_requests` (already partially exists; will be expanded next PR)
- PR3: services inheritance/override UI polish
- PR4: rate limiting, HIBP toggle, backup/restore, SECURITY DEFINER lint cleanup
