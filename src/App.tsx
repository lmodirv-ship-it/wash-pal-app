import { ReactNode, Suspense, lazy } from "react";
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
const Entries = lazy(() => import("./pages/Entries"));
const SupervisorProspecting = lazy(() => import("./pages/SupervisorProspecting"));
const MessageTemplates = lazy(() => import("./pages/MessageTemplates"));
const Coupons = lazy(() => import("./pages/Coupons"));

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
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (rolesLoading || roles === null) return <LoadingScreen />;
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

            {/* Platform owner only */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/pricing-plans" element={<AdminPricingPlans />} />
              <Route path="/admin/leads" element={<AdminLeads />} />
              <Route path="/admin/api-keys" element={<AdminApiKeys />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/audit-logs" element={<RoleAuditLogs />} />
            </Route>

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
              <Route path="/employee" element={<EmployeeApp />} />
              <Route path="/work" element={<Navigate to="/employee" replace />} />
            </Route>

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
