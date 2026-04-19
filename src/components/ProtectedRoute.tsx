import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin"
  | "admin"
  | "supervisor"
  | "manager"
  | "employee"
  | "customer";

interface Props {
  children: ReactNode;
  allowedRoles: AppRole[];
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030308]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  );
}

/**
 * Resolves the user's effective roles by combining:
 *  - profile.role (super_admin / admin / customer)
 *  - shop_members.role[] (supervisor / manager / employee)
 */
async function resolveUserRoles(
  userId: string,
  profileRole: string | undefined
): Promise<AppRole[]> {
  const roles = new Set<AppRole>();
  if (profileRole === "admin") roles.add("admin");
  if (profileRole === "super_admin") roles.add("super_admin");
  if (profileRole === "customer") roles.add("customer");

  const { data } = await supabase
    .from("shop_members")
    .select("role")
    .eq("user_id", userId);

  data?.forEach((r) => {
    if (r.role) roles.add(r.role as AppRole);
  });

  return Array.from(roles);
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth();
  const [userRoles, setUserRoles] = useState<AppRole[] | null>(null);

  useEffect(() => {
    if (!user || !profile) { setUserRoles(null); return; }
    resolveUserRoles(user.id, profile.role).then(setUserRoles);
  }, [user, profile]);

  // 1. Still loading auth or profile
  if (loading || (user && !profile)) return <LoadingScreen />;

  // 2. Not authenticated → login
  if (!user) return <Navigate to="/login" replace />;

  // 3. Resolving roles
  if (userRoles === null) return <LoadingScreen />;

  // 4. SUPER ADMIN OVERRIDE — bypasses all restrictions
  const isSuperAdmin =
    userRoles.includes("super_admin") || userRoles.includes("admin");
  if (isSuperAdmin) return <>{children}</>;

  // 5. Role-based check
  const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
  if (!hasAccess) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
