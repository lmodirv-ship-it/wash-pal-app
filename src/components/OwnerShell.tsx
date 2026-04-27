import { ReactNode, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import { useEffectiveRoles } from "@/hooks/useEffectiveRoles";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030308]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري التحقق من صلاحيات المالك...</p>
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
    <AppProvider>
      <Layout>
        {children ?? <Outlet />}
      </Layout>
    </AppProvider>
  );
}

export default OwnerShell;
