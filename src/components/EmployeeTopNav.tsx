import { NavLink } from "react-router-dom";
import { Droplets, ClipboardEdit } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmployeeTopNav() {
  const { t } = useTranslation();
  const base =
    "flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-bold border-2 transition-all";
  const inactive = "border-border bg-card text-muted-foreground hover:border-primary/50";
  const active = "border-primary bg-primary text-primary-foreground shadow-glow";

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
      </nav>
    </div>
  );
}