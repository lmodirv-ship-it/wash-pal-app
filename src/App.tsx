import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
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
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp } from "@/contexts/AppContext";

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

function ShopGate({ children, role }: { children: ReactNode; role: string }) {
  const { tenantShops, loading } = useApp();
  if (loading) return <LoadingScreen />;
  // Customers/employees don't need to own a shop
  const needsShop = role === 'admin' || role === 'manager' || role === 'supervisor';
  if (needsShop && tenantShops.length === 0) return <Navigate to="/create-shop" replace />;
  return <>{children}</>;
}

function ProtectedRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role || 'employee';
  const isSuperAdmin = role === 'admin';
  const isShopManager = role === 'manager' || role === 'supervisor';
  const isCustomer = role === 'customer';
  const isEmployee = role === 'employee';

  const homeFor = (r: string) => {
    if (r === 'admin') return '/admin';
    if (r === 'manager' || r === 'supervisor') return '/dashboard';
    if (r === 'customer') return '/app';
    return '/employee';
  };

  return (
    <AppProvider>
      <ShopGate role={role}>
      <Layout>
        <Routes>
          {/* Index for nested parent — render the role's home page directly to avoid redirect loops */}
          <Route index element={
            role === 'admin' ? <AdminDashboard /> :
            (role === 'manager' || role === 'supervisor') ? <Index /> :
            role === 'customer' ? <CustomerApp /> : <EmployeeApp />
          } />

          {/* Admin pages — relative paths so they work under any parent */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />

          {(isSuperAdmin || isShopManager) && (
            <>
              <Route path="dashboard" element={<Index />} />
              <Route path="orders" element={<Orders />} />
              <Route path="customers" element={<Customers />} />
              <Route path="employees" element={<Employees />} />
              <Route path="services" element={<Services />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="reports" element={<Reports />} />
              <Route path="finance" element={<Finance />} />
              <Route path="branches" element={<Branches />} />
              <Route path="shops" element={<Shops />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="team" element={<Team />} />
            </>
          )}
          <Route path="employee" element={<EmployeeApp />} />
          <Route path="work" element={<Navigate to="/employee" replace />} />
          <Route path="app" element={<CustomerApp />} />
          {isEmployee && <Route path="*" element={<Navigate to="/employee" replace />} />}
          {isCustomer && <Route path="*" element={<Navigate to="/app" replace />} />}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      </ShopGate>
    </AppProvider>
  );
}

// Smart redirect after login: role-based home derived from shop_members + profile
function PostLoginRedirect() {
  const { user, profile, loading } = useAuth();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !profile) return;

    // 1) Profile-level roles take priority (super-admin / customer)
    const pRole = profile.role;
    if (pRole === "admin") { setTarget("/admin"); return; }
    if (pRole === "customer") { setTarget("/app"); return; }

    // 2) Otherwise derive from shop_members (highest privilege wins)
    (async () => {
      const { data } = await supabase
        .from("shop_members")
        .select("role")
        .eq("user_id", user.id);

      if (!data || data.length === 0) {
        // No shop yet → onboarding
        setTarget("/create-shop");
        return;
      }
      const roles = data.map((r) => r.role);
      if (roles.includes("supervisor") || roles.includes("manager")) {
        setTarget("/dashboard");
      } else if (roles.includes("employee")) {
        setTarget("/employee");
      } else {
        setTarget("/app");
      }
    })();
  }, [user, profile, loading]);

  if (loading || (user && !profile) || !target) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={target} replace />;
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
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/post-login" element={<PostLoginRedirect />} />
            <Route path="/start" element={<StartFree />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/create-shop" element={<AuthedCreateShop />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />

            {/* Super-admin only */}
            <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["super_admin", "admin"]}><ProtectedRoutes /></ProtectedRoute>} />

            {/* Supervisor + Manager + Admin (admin has full access) */}
            {[
              "/dashboard", "/orders", "/customers", "/employees", "/services",
              "/invoices", "/reports", "/finance", "/branches", "/shops",
              "/settings", "/team",
            ].map((path) => (
              <Route
                key={path}
                path={`${path}/*`}
                element={
                  <ProtectedRoute allowedRoles={["admin", "supervisor", "manager"]}>
                    <ProtectedRoutes />
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Employee */}
            <Route path="/employee" element={<ProtectedRoute allowedRoles={["employee", "supervisor", "manager"]}><ProtectedRoutes /></ProtectedRoute>} />

            {/* Customer */}
            <Route path="/app" element={<ProtectedRoute allowedRoles={["customer"]}><ProtectedRoutes /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
