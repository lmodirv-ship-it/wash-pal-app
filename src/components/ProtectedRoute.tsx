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
    <div className="w-full p-4 md:p-6 bg-background">
      <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-5">
        <div className="h-6 w-52 rounded-md skeleton-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl skeleton-shimmer" />
          ))}
        </div>
        <div className="h-56 rounded-xl skeleton-shimmer" />
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
