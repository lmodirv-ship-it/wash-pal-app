import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Droplets, BarChart3, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export function MobileBottomNav() {
  const { isAdmin, signOut } = useAuth();
  const { t } = useTranslation();

  const adminItems = [
    { title: t("nav.home"), url: "/", icon: LayoutDashboard },
    { title: t("nav.operations"), url: "/orders", icon: Receipt },
    { title: t("nav.services"), url: "/services", icon: Droplets },
    { title: t("nav.reports"), url: "/reports", icon: BarChart3 },
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];
  const employeeItems = [
    { title: t("nav.services"), url: "/services", icon: Droplets },
    { title: t("nav.invoices"), url: "/invoices", icon: Receipt },
  ];
  const items = isAdmin ? adminItems : employeeItems;
  const totalCols = items.length + 1;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border" style={{ boxShadow: '0 -4px 20px hsl(220 25% 12% / 0.06)' }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-primary/10" : ""}`}>
                  <item.icon className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[10px] font-medium">{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={signOut}
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-muted-foreground hover:text-destructive transition-colors"
        >
          <div className="p-1.5 rounded-lg">
            <LogOut className="w-[18px] h-[18px]" />
          </div>
          <span className="text-[10px] font-medium">{t("nav.logout")}</span>
        </button>
      </div>
    </nav>
  );
}
