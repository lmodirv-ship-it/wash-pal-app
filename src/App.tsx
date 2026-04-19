import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Services from "./pages/Services";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Branches from "./pages/Branches";
import Shops from "./pages/Shops";
import SettingsPage from "./pages/Settings";
import Finance from "./pages/Finance";
import EmployeeApp from "./pages/EmployeeApp";
import CustomerApp from "./pages/CustomerApp";
import CreateShop from "./pages/CreateShop";
import Team from "./pages/Team";
import AcceptInvite from "./pages/AcceptInvite";
import StartFree from "./pages/StartFree";
import Pricing from "./pages/Pricing";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminPricingPlans from "./pages/AdminPricingPlans";
import Entries from "./pages/Entries";
import ProtectedRoute from "./components/ProtectedRoute";

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
  const { profile } = useAuth();
  const role = profile?.role || "employee";
  const needsShop = role === "admin" || role === "manager" || role === "supervisor";

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
  const { profile, loading, user } = useAuth();
  if (loading || (user && !profile)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const role = profile?.role;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "customer") return <Navigate to="/app" replace />;
  if (role === "employee") return <Navigate to="/employee" replace />;
  return <Navigate to="/dashboard" replace />;
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

            {/* Super-admin */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/pricing-plans" element={<AdminPricingPlans />} />
            </Route>

            {/* Manager / Supervisor / Admin */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["admin", "supervisor", "manager"]}>
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
            </Route>

            {/* Employee — fullscreen, no sidebar/layout */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["employee", "supervisor", "manager"]}>
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
