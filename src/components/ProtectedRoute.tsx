import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveRoles, AppRole, homeForRole, pickPrimaryRole } from "@/hooks/useEffectiveRoles";

export type { AppRole };

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

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth();
  const { roles, loading: rolesLoading } = useEffectiveRoles();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (rolesLoading || roles === null) return <LoadingScreen />;

  // Owner is the only role with implicit access to every protected route.
  const isOwner = roles.includes("owner");
  const hasAccess = isOwner || roles.some((r) => allowedRoles.includes(r));
  if (!hasAccess) {
    // For owner-only routes, send everyone else to the operational dashboard.
    const ownerOnly = allowedRoles.length === 1 && allowedRoles[0] === "owner";
    return (
      <Navigate
        to={ownerOnly ? "/dashboard" : homeForRole(pickPrimaryRole(roles))}
        replace
      />
    );
  }
  return <>{children}</>;
}
