import { ReactNode, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { OwnerLayout } from "@/components/OwnerLayout";
import { useEffectiveRoles } from "@/hooks/useEffectiveRoles";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-5">
        <div className="h-6 w-56 rounded-md skeleton-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl skeleton-shimmer" />
          ))}
        </div>
        <div className="h-72 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

/**
 * OwnerShell — defense-in-depth wrapper for /owner/*
 * - Re-validates owner role inside the page (independent of Route guard).
 * - Adds <meta name="robots" content="noindex,nofollow"> while mounted.
 * - Sets a distinct document title so this surface never blends with the shop UI.
 */
export function OwnerShell({ children }: { children?: ReactNode }) {
  const { roles, loading } = useEffectiveRoles();

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = "Owner Console";
    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  if (loading || roles === null) return <LoadingScreen />;
  if (!roles.includes("owner")) return <Navigate to="/dashboard" replace />;

  return (
    <OwnerLayout>
      {children ?? <Outlet />}
    </OwnerLayout>
  );
}

export default OwnerShell;
