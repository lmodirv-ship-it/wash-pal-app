import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppProvider, useApp } from "@/contexts/AppContext";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030308]">
      <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
    </div>
  );
}

function SmartRedirect() {
  const { tenantShops, loading } = useApp();
  if (loading) return <LoadingScreen />;
  // If user already has shops → straight to dashboard
  if (tenantShops.length > 0) return <Navigate to="/dashboard" replace />;
  // Otherwise → onboarding
  return <Navigate to="/create-shop" replace />;
}

/**
 * Smart entry for the Landing "Start Free" CTA.
 * - Not authed → /login?next=/start
 * - Authed + no shops → /create-shop
 * - Authed + has shops → /dashboard
 */
export default function StartFree() {
  const { user, profile, loading } = useAuth();
  if (loading || (user && !profile)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login?next=/start" replace />;
  return (
    <AppProvider>
      <SmartRedirect />
    </AppProvider>
  );
}
