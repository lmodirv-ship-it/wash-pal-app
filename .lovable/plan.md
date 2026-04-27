# Phase 1.5 — Owner/Admin Hardening (Transitional)

## Scope (locked)
- **Do NOT** remove or narrow existing `*_admin_all` RLS policies. They stay as-is for the transitional period.
- **Do NOT** drop `profiles.role`.
- **Do NOT** expand `audit_logs`.
- **Do NOT** modify table schemas beyond what's strictly required.
- All changes are additive guards + UI gating.

## Confirmed current state (already in DB)
- `app_role` enum already includes `owner`.
- `*_owner_all` policies already exist on all sensitive tables alongside `*_admin_all`.
- `is_owner()` SECURITY DEFINER function exists.
- `prevent_role_self_escalation` already blocks non-owners from touching `owner` role.
- `lmodirv@gmail.com` already has `owner` in `user_roles`.

So the remaining gaps are: signup hardening, last-owner protection, a clean shop-team helper, and UI gating of the `owner` dropdown option.

---

## 1. Database migration

### 1a. Harden `handle_new_user` — strip `owner` from metadata
Currently `handle_new_user` accepts any role from `raw_user_meta_data` if it is in the allowlist `('admin','manager','supervisor','employee','customer')`. `owner` is not in that list, so it already falls back to `employee` — but we make this explicit and also forbid `admin` from self-signup (since `admin` = shop owner now and must be created via shop creation flow).

Updated logic:
- If metadata role is `owner` → force to `customer`.
- If metadata role is `admin` → force to `customer` (admin role must be granted explicitly).
- Otherwise keep current allowlist behavior.

### 1b. Harden `prevent_role_self_escalation`
Add explicit rule: **block deletion of the last owner**.

```sql
-- on DELETE or on UPDATE that removes owner:
IF OLD.role = 'owner' AND (TG_OP = 'DELETE' OR NEW.role IS DISTINCT FROM 'owner') THEN
  IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'owner') <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last platform owner';
  END IF;
END IF;
```

The existing rule "only owner can grant/remove owner" stays. We also extend the trigger to cover `DELETE` (currently it only covers `UPDATE`).

### 1c. New helper: `can_manage_shop_team(_shop_id uuid)`
SECURITY DEFINER, returns true if caller is:
- `is_owner()`, OR
- shop owner (`shops.owner_id = auth.uid()`), OR
- has `admin` role AND is a member of `_shop_id` (via `shop_members` or owns shop), OR
- is a `supervisor` member of `_shop_id`.

This replaces the ambiguity around `is_shop_manager` for team-management contexts. We add the function but **do not yet rewrite policies to use it** — that's a later migration. We will use it only in any new code paths that need it.

### 1d. (Out of scope, explicitly NOT done now)
- No rewriting of `*_admin_all` to `is_owner()` only. That's a future migration.
- No changes to `is_shop_member` / `is_shop_manager`.
- No new audit categories.

---

## 2. Frontend changes

### 2a. `src/pages/AdminUsers.tsx` (role dropdown)
- Compute `isPlatformOwner` from `useEffectiveRoles` (`roles.includes('owner')`).
- The role `<Select>` options:
  - `owner` option is rendered **only if** `isPlatformOwner === true`.
  - Other roles (`admin`, `supervisor`, `manager`, `employee`, `customer`) render as today.
- When a non-owner tries to submit and somehow has `owner` selected, block client-side with toast (defense in depth — RLS+trigger are the real guard).

### 2b. `src/hooks/useEffectiveRoles.ts`
No type changes (already includes `owner`). Verify `ROLE_PRIORITY` puts `owner` at index 0. No-op if already correct.

### 2c. Sidebar / routing
No changes required — already updated in previous step.

---

## 3. Verification checklist
After migration + code edits:
1. `npm run build` succeeds.
2. Login as `lmodirv@gmail.com` → effective role = `owner` → `/admin/*` accessible.
3. Open AdminUsers as owner → `owner` option visible in role dropdown.
4. Open AdminUsers as a regular `admin` user (manual SQL test or second account) → `owner` option **not** visible.
5. SQL sanity: `SELECT public.can_manage_shop_team('<some-shop-id>');` returns expected boolean.
6. Attempt to delete the only `owner` row via SQL → should fail with `Cannot remove the last platform owner`.
7. Signup with `raw_user_meta_data->>'role' = 'owner'` → user is created with role `customer`, not `owner`.

---

## 4. Files touched
- New migration: `supabase/migrations/<ts>_owner_admin_hardening.sql`
  - Replaces `handle_new_user`, replaces `prevent_role_self_escalation`, adds `can_manage_shop_team`.
- `src/pages/AdminUsers.tsx` — gate `owner` option in dropdown.

That's the entire change set. No other files, no other policies, no schema drift.