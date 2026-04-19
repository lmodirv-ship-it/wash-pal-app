import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
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
import NotFound from "./pages/NotFound";
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
  const isAdmin = role === 'admin' || role === 'manager';
  const isCustomer = role === 'customer';
  const isEmployee = role === 'employee';

  return (
    <AppProvider>
      <ShopGate role={role}>
      <Layout>
        <Routes>
          <Route path="/" element={isAdmin ? <Index /> : <Navigate to={isEmployee ? "/employee" : "/app"} replace />} />
          {isAdmin && (
            <>
              <Route path="/orders" element={<Orders />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/services" element={<Services />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/shops" element={<Shops />} />
              <Route path="/settings" element={<SettingsPage />} />
            </>
          )}
          <Route path="/employee" element={<EmployeeApp />} />
          <Route path="/work" element={<Navigate to="/employee" replace />} />
          <Route path="/app" element={<CustomerApp />} />
          {isEmployee && <Route path="*" element={<Navigate to="/employee" replace />} />}
          {isCustomer && <Route path="*" element={<Navigate to="/app" replace />} />}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}

// Smart redirect after login: send user to their role-based home
function PostLoginRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading || (user && !profile)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const role = profile?.role || 'employee';
  if (role === 'admin' || role === 'manager') return <Navigate to="/dashboard" replace />;
  if (role === 'employee') return <Navigate to="/employee" replace />;
  return <Navigate to="/app" replace />;
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/post-login" element={<PostLoginRedirect />} />
            <Route path="/dashboard/*" element={<ProtectedRoutes />} />
            <Route path="/employee" element={<ProtectedRoutes />} />
            <Route path="/app" element={<ProtectedRoutes />} />
            <Route path="/orders" element={<ProtectedRoutes />} />
            <Route path="/customers" element={<ProtectedRoutes />} />
            <Route path="/employees" element={<ProtectedRoutes />} />
            <Route path="/services" element={<ProtectedRoutes />} />
            <Route path="/invoices" element={<ProtectedRoutes />} />
            <Route path="/reports" element={<ProtectedRoutes />} />
            <Route path="/finance" element={<ProtectedRoutes />} />
            <Route path="/branches" element={<ProtectedRoutes />} />
            <Route path="/shops" element={<ProtectedRoutes />} />
            <Route path="/settings" element={<ProtectedRoutes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
