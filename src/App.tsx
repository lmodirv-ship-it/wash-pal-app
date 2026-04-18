import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-muted-foreground animate-pulse">جاري التحميل...</p>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role || 'employee';
  const isAdmin = role === 'admin' || role === 'manager';
  const isCustomer = role === 'customer';
  const isEmployee = role === 'employee';

  const path = window.location.pathname;
  if (path === '/') {
    if (isEmployee) return <Navigate to="/work" replace />;
    if (isCustomer) return <Navigate to="/app" replace />;
  }

  return (
    <AppProvider>
      <Layout>
        <Routes>
          {isAdmin && (
            <>
              <Route path="/" element={<Index />} />
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
          {isEmployee && (
            <>
              <Route path="/work" element={<EmployeeApp />} />
              <Route path="*" element={<Navigate to="/work" replace />} />
            </>
          )}
          {isCustomer && (
            <>
              <Route path="/app" element={<CustomerApp />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </>
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
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
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
