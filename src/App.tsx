import { ReactNode, Suspense, lazy, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffectiveRoles, homeForRole, pickPrimaryRole } from "@/hooks/useEffectiveRoles";
import { Layout } from "@/components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";

// Lazy-loaded pages — drastically reduces initial bundle
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Index = lazy(() => import("./pages/Index"));
const Orders = lazy(() => import("./pages/Orders"));
const Customers = lazy(() => import("./pages/Customers"));
const Employees = lazy(() => import("./pages/Employees"));
const Services = lazy(() => import("./pages/Services"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Reports = lazy(() => import("./pages/Reports"));
const Branches = lazy(() => import("./pages/Branches"));
const Shops = lazy(() => import("./pages/Shops"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Finance = lazy(() => import("./pages/Finance"));
const EmployeeApp = lazy(() => import("./pages/EmployeeApp"));
const EmployeeServices = lazy(() => import("./pages/EmployeeServices"));
const CustomerApp = lazy(() => import("./pages/CustomerApp"));
const CreateShop = lazy(() => import("./pages/CreateShop"));
const Team = lazy(() => import("./pages/Team"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const StartFree = lazy(() => import("./pages/StartFree"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const AdminPricingPlans = lazy(() => import("./pages/AdminPricingPlans"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminApiKeys = lazy(() => import("./pages/AdminApiKeys"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const RoleAuditLogs = lazy(() => import("./pages/RoleAuditLogs"));
const OwnerShell = lazy(() =>
  import("./components/OwnerShell").then((m) => ({ default: m.OwnerShell }))
);
const OwnerShops = lazy(() => import("./pages/OwnerShops"));
const OwnerSecurity = lazy(() => import("./pages/OwnerSecurity"));
const OwnerActivity = lazy(() => import("./pages/OwnerActivity"));
const OwnerNotifications = lazy(() => import("./pages/OwnerNotifications"));
const OwnerDatabase = lazy(() => import("./pages/OwnerDatabase"));
const OwnerSettings = lazy(() => import("./pages/OwnerSettings"));
const OwnerExports = lazy(() => import("./pages/OwnerExports"));
const Entries = lazy(() => import("./pages/Entries"));
const SupervisorProspecting = lazy(() => import("./pages/SupervisorProspecting"));
const MessageTemplates = lazy(() => import("./pages/MessageTemplates"));
const Coupons = lazy(() => import("./pages/Coupons"));
const JoinShop = lazy(() => import("./pages/JoinShop"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const JoinRequests = lazy(() => import("./pages/JoinRequests"));

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030308]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}

/** Wraps protected pages with AppProvider + Layout + shop gate */
function AppShell() {
  const { roles } = useEffectiveRoles();
  const list = roles ?? [];
  const needsShop =
    list.includes("admin") || list.includes("manager") || list.includes("supervisor");
  return (
    <AppProvider>
      <ShopGate needsShop={needsShop}>
        <Layout>
          <Outlet />
        </Layout>
      </ShopGate>
    </AppProvider>
  );
}

function ShopGate({ needsShop, children }: { needsShop: boolean; children: ReactNode }) {
  const { tenantShops, loading } = useApp();
  if (loading) return <LoadingScreen />;
  if (needsShop && tenantShops.length === 0) return <Navigate to="/create-shop" replace />;
  return <>{children}</>;
}

/** Smart root redirect based on role */
function RoleHomeRedirect() {
  const { user, loading } = useAuth();
  const { roles, loading: rolesLoading } = useEffectiveRoles();
  const [pendingCheck, setPendingCheck] = useState<"loading" | "yes" | "no">("loading");

  useEffect(() => {
    if (!user) { setPendingCheck("no"); return; }
    (async () => {
      const { data } = await supabase
        .from("employee_join_requests")
        .select("id,status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1);
      setPendingCheck((data?.length || 0) > 0 ? "yes" : "no");
    })();
  }, [user]);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (rolesLoading || roles === null || pendingCheck === "loading") return <LoadingScreen />;

  // If the user has only customer/employee role and a pending request, send them to the waiting page.
  const hasShopRole = roles.some((r) => ["owner", "admin", "supervisor", "manager", "employee"].includes(r));
  if (pendingCheck === "yes" && !hasShopRole) {
    return <Navigate to="/pending-approval" replace />;
  }
  return <Navigate to={homeForRole(pickPrimaryRole(roles))} replace />;
}

function AuthedCreateShop() {
  const { user, profile, loading } = useAuth();
  if (loading || (user && !profile)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login?redirect=create-shop" replace />;
  return (
    <AppProvider>
      <CreateShop />
    </AppProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/post-login" element={<RoleHomeRedirect />} />
            <Route path="/start" element={<StartFree />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/create-shop" element={<AuthedCreateShop />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="/join-shop" element={<JoinShop />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Platform owner console — fully isolated under /owner/* */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <OwnerShell />
                </ProtectedRoute>
              }
            >
              <Route path="/owner" element={<AdminDashboard />} />
              <Route path="/owner/shops" element={<OwnerShops />} />
              <Route path="/owner/security" element={<OwnerSecurity />} />
              <Route path="/owner/activity" element={<OwnerActivity />} />
              <Route path="/owner/notifications" element={<OwnerNotifications />} />
              <Route path="/owner/database" element={<OwnerDatabase />} />
              <Route path="/owner/settings" element={<OwnerSettings />} />
              <Route path="/owner/exports" element={<OwnerExports />} />
              <Route path="/owner/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/owner/pricing-plans" element={<AdminPricingPlans />} />
              <Route path="/owner/leads" element={<AdminLeads />} />
              <Route path="/owner/api-keys" element={<AdminApiKeys />} />
              <Route path="/owner/users" element={<AdminUsers />} />
              <Route path="/owner/audit-logs" element={<RoleAuditLogs />} />
              <Route path="/owner/role-audit-logs" element={<RoleAuditLogs />} />
            </Route>

            {/* Legacy /admin/* paths → /owner/* (guard then runs and blocks non-owners) */}
            <Route path="/admin" element={<Navigate to="/owner" replace />} />
            <Route path="/admin/subscriptions" element={<Navigate to="/owner/subscriptions" replace />} />
            <Route path="/admin/pricing-plans" element={<Navigate to="/owner/pricing-plans" replace />} />
            <Route path="/admin/leads" element={<Navigate to="/owner/leads" replace />} />
            <Route path="/admin/api-keys" element={<Navigate to="/owner/api-keys" replace />} />
            <Route path="/admin/users" element={<Navigate to="/owner/users" replace />} />
            <Route path="/admin/audit-logs" element={<Navigate to="/owner/audit-logs" replace />} />

            {/* Manager / Supervisor / Admin */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["owner", "admin", "supervisor", "manager"]}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Index />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/services" element={<Services />} />
              <Route path="/entries" element={<Entries />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/shops" element={<Shops />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/team" element={<Team />} />
              <Route path="/prospecting" element={<SupervisorProspecting />} />
              <Route path="/templates" element={<MessageTemplates />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/dashboard/join-requests" element={<JoinRequests />} />
              <Route path="/join-requests" element={<Navigate to="/dashboard/join-requests" replace />} />
            </Route>

            {/* Employee — fullscreen, no sidebar/layout */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["owner", "employee", "supervisor", "manager"]}>
                  <AppProvider>
                    <ShopGate needsShop={false}>
                      <Outlet />
                    </ShopGate>
                  </AppProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard/work" element={<EmployeeApp />} />
              <Route path="/dashboard/services" element={<EmployeeServices />} />
            </Route>

            {/* Legacy /employee/* aliases → /dashboard/* (guards run on the destinations) */}
            <Route path="/employee" element={<Navigate to="/dashboard/work" replace />} />
            <Route path="/employee/services" element={<Navigate to="/dashboard/services" replace />} />
            <Route path="/employee/*" element={<Navigate to="/dashboard/work" replace />} />
            <Route path="/work" element={<Navigate to="/dashboard/work" replace />} />

            {/* Customer */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/app" element={<CustomerApp />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
