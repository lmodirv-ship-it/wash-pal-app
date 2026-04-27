import { NavLink, useNavigate } from "react-router-dom";
import { Droplets, ClipboardEdit, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function EmployeeTopNav() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const base =
    "flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-bold border-2 transition-all";
  const inactive = "border-border bg-card text-muted-foreground hover:border-primary/50";
  const active = "border-primary bg-primary text-primary-foreground shadow-glow";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      toast.success(t("auth.signedOut", { defaultValue: "تم تسجيل الخروج" }));
      navigate("/login", { replace: true });
    } catch (e: any) {
      toast.error(e?.message || t("common.error", { defaultValue: "حدث خطأ" }));
      setLoggingOut(false);
    }
  };

  return (
    <div className="sticky top-0 z-20 -mx-3 px-3 py-2 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65 border-b border-border/40">
      <nav className="flex items-stretch gap-2 max-w-2xl mx-auto" aria-label="Employee navigation">
        <NavLink to="/employee" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <ClipboardEdit className="w-4 h-4" />
          <span>{t("employeeApp.newOrderTab", { defaultValue: "تسجيل طلب" })}</span>
        </NavLink>
        <NavLink to="/employee/services" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <Droplets className="w-4 h-4" />
          <span>{t("nav.services", { defaultValue: "الخدمات" })}</span>
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label={t("auth.signOut", { defaultValue: "تسجيل الخروج" })}
          className={`${base} ${inactive} max-w-[44px] disabled:opacity-60`}
        >
          <LogOut className={`w-4 h-4 ${loggingOut ? "animate-pulse" : ""}`} />
        </button>
      </nav>
    </div>
  );
}