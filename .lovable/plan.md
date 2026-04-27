## Root cause

`/owner/services` renders `<Services />` (which calls `useApp()`) under the `OwnerShell` outlet. The current line in `src/App.tsx`:

```tsx
<Route path="/owner/services" element={<AppProvider><Services /></AppProvider>} />
```

…does wrap a provider inline, but the wrap lives **inside** `<Suspense>` and is recreated on every Suspense resolution of the lazy `Services` chunk. During the brief window where `Services` resolves before the inline `AppProvider` mounts its first effect, React already commits the consumer in another tree (the previous render of the prior owner page). This intermittently throws `useApp must be used within AppProvider`. It's also fragile: every other owner page would crash the same way if it ever called `useApp`.

The robust fix: wrap the **entire owner outlet** in `AppProvider` once, exactly the way `AppShell` does for `/dashboard/*`. Then drop the inline wrap on `/owner/services`.

## Files to change

- `src/App.tsx`
  1. Add a small `OwnerOutlet` wrapper component (mirrors `AppShell` but uses `OwnerShell` instead of `Layout`, and skips the `ShopGate` since owners don't need a shop):
     ```tsx
     function OwnerOutlet() {
       return (
         <AppProvider>
           <OwnerShell />
         </AppProvider>
       );
     }
     ```
  2. Change the owner route group from:
     ```tsx
     <ProtectedRoute allowedRoles={["owner"]}>
       <OwnerShell />
     </ProtectedRoute>
     ```
     to:
     ```tsx
     <ProtectedRoute allowedRoles={["owner"]}>
       <OwnerOutlet />
     </ProtectedRoute>
     ```
  3. Replace line 195 with the plain element:
     ```tsx
     <Route path="/owner/services" element={<Services />} />
     ```

## Files NOT changed
- `src/pages/Services.tsx` — already imports `useApp` from the single canonical path `@/contexts/AppContext`. No duplicates exist (verified via `rg`).
- `src/contexts/AppContext.tsx` — single source of truth, untouched.
- `src/components/OwnerShell.tsx`, `OwnerLayout.tsx`, `OwnerSidebar.tsx` — none of them call `useApp`; no changes needed.
- `/services` (line 232) and `/dashboard/services` (line 261) — both already inherit `AppProvider` from `AppShell` / inline provider; untouched.
- `ProtectedRoute` guard (`allowedRoles={["owner"]}`) — unchanged; non-owners still blocked.

## Why this is safe
- One `AppProvider` per route tree (same pattern as `AppShell`).
- `AppProvider` runs queries scoped to the authenticated user; for an owner without a tenant shop it simply returns empty `tenantShops` / `services` and does not redirect (we're not using `ShopGate` here).
- All other owner pages keep working — they just now have access to `useApp` if they ever need it, but none currently call it.

## Verification

- `bun run build` and `tsc --noEmit` pass.
- Visit `/owner/services` as owner → page renders, no error.
- Visit `/services` as admin/manager → still works.
- Visit `/dashboard/services` as employee → still works.
- Visit `/owner` as non-owner → still redirects to `/dashboard`.

## Deliverable snippet (after change)

```tsx
function OwnerOutlet() {
  return (
    <AppProvider>
      <OwnerShell />
    </AppProvider>
  );
}

// ...
<Route
  element={
    <ProtectedRoute allowedRoles={["owner"]}>
      <OwnerOutlet />
    </ProtectedRoute>
  }
>
  <Route path="/owner" element={<AdminDashboard />} />
  <Route path="/owner/shops" element={<OwnerShops />} />
  <Route path="/owner/services" element={<Services />} />
  {/* ...rest unchanged... */}
</Route>
```