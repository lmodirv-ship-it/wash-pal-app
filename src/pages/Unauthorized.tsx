import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectiveRoles, homeForRole, pickPrimaryRole } from "@/hooks/useEffectiveRoles";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();
  const { roles, loading } = useEffectiveRoles();

  // Authenticated users should never see this page — auto-redirect to their home.
  if (user) {
    if (loading || roles === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#030308]">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      );
    }
    return <Navigate to={homeForRole(pickPrimaryRole(roles))} replace />;
  }

  const homePath = "/login";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-100 to-orange-100 blur-2xl" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/30">
            <ShieldAlert className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
          غير مصرّح بالدخول
        </h1>
        <p className="text-slate-600 leading-relaxed mb-2">
          ليس لديك الصلاحية للوصول إلى هذه الصفحة.
        </p>
        {profile?.role && (
          <p className="text-sm text-slate-500 mb-8">
            دورك الحالي: <span className="font-bold text-slate-700">{profile.role}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-12 rounded-xl border-slate-200 px-6"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            رجوع
          </Button>
          <Link to={homePath}>
            <Button className="h-12 rounded-xl px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-lg shadow-blue-500/25 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              صفحتي الرئيسية
            </Button>
          </Link>
        </div>

        {user && (
          <button
            onClick={() => signOut()}
            className="mt-8 text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            تسجيل الخروج وتجربة حساب آخر
          </button>
        )}
      </div>
    </div>
  );
}
