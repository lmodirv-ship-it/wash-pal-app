import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Must match the public.app_role enum in the database EXACTLY.
export type AppRole = "admin" | "manager" | "supervisor" | "employee" | "customer";

export const ALL_ROLES: AppRole[] = ["admin", "manager", "supervisor", "employee", "customer"];

/** Highest-priority role first. Used to pick a "home" route. */
export const ROLE_PRIORITY: AppRole[] = ["admin", "supervisor", "manager", "employee", "customer"];

export function homeForRole(role: AppRole | undefined): string {
  switch (role) {
    case "admin": return "/admin";
    case "supervisor":
    case "manager": return "/dashboard";
    case "employee": return "/employee";
    case "customer": return "/app";
    default: return "/post-login";
  }
}

export function pickPrimaryRole(roles: AppRole[]): AppRole | undefined {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return undefined;
}

/**
 * Resolves the user's effective roles by merging:
 *  - profiles.role (single role, also mirrored in user_roles by trigger)
 *  - user_roles[] (the source of truth)
 *  - shop_members.role[] (per-shop role: supervisor/manager/employee)
 */
export function useEffectiveRoles() {
  const { user, profile, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setRoles(null); return; }

    (async () => {
      const set = new Set<AppRole>();
      // profile.role mirror
      if (profile?.role && (ALL_ROLES as string[]).includes(profile.role)) {
        set.add(profile.role as AppRole);
      }
      // user_roles is the canonical source
      const { data: ur } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      ur?.forEach((r: any) => {
        if ((ALL_ROLES as string[]).includes(r.role)) set.add(r.role as AppRole);
      });
      // per-shop roles
      const { data: sm } = await supabase
        .from("shop_members")
        .select("role")
        .eq("user_id", user.id);
      sm?.forEach((r: any) => {
        if ((ALL_ROLES as string[]).includes(r.role)) set.add(r.role as AppRole);
      });

      if (!cancelled) setRoles(Array.from(set));
    })();

    return () => { cancelled = true; };
  }, [user, profile]);

  return { roles, loading: authLoading || (!!user && roles === null) };
}