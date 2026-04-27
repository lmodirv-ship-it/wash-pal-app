import {
  LayoutDashboard, Receipt, Users, UserCog, Droplets,
  FileText, BarChart3, Building2, Settings, Store, LogOut, Wallet, UserPlus, ShieldCheck, CreditCard, Package, ClipboardList, Globe2, Mail, Ticket, ShieldAlert, Key, ScrollText, Database,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface NavEntry { title: string; url: string; icon: any; badge?: number | string; }

function NavCard({ item, isActive, collapsed }: { item: NavEntry; isActive: boolean; collapsed: boolean }) {
  return (
    <NavLink
      to={item.url}
      end={item.url === "/"}
      className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3.5 transition-all duration-200 border backdrop-blur-md
        ${isActive
          ? "bg-[hsl(var(--primary)/0.12)] border-[hsl(var(--primary)/0.6)] text-[hsl(var(--primary))] shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6),inset_0_1px_0_hsl(0_0%_100%/0.08)]"
          : "bg-gradient-to-b from-[hsl(230_35%_10%/0.85)] to-[hsl(230_40%_5%/0.9)] border-[hsl(var(--primary)/0.3)] text-foreground/90 shadow-[0_2px_8px_-2px_hsl(220_60%_2%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.05)] hover:border-[hsl(var(--primary)/0.55)] hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.45),inset_0_1px_0_hsl(0_0%_100%/0.08)]"
        }`}
      activeClassName=""
    >
      <span className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 transition border
        ${isActive
          ? "bg-[hsl(var(--primary)/0.18)] border-[hsl(var(--primary)/0.5)] text-[hsl(var(--primary))]"
          : "bg-[hsl(230_40%_5%/0.7)] border-[hsl(var(--primary)/0.25)] text-foreground/75 group-hover:text-[hsl(var(--primary))]"}`}>
        <item.icon className="w-[20px] h-[20px]" />
      </span>
      {!collapsed && (
        <>
          <span className="text-[15px] font-bold flex-1 truncate">{item.title}</span>
          {item.badge !== undefined && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/90 text-destructive-foreground tabular-nums">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { currentBranch } = useApp();
  const { profile, user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const role = profile?.role || "employee";
  const isPathActive = (url: string) => url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  // Owner console (platform-wide) — visible ONLY to platform owners.
  const ownerItems: NavEntry[] = [
    { title: "Owner Dashboard", url: "/owner", icon: LayoutDashboard },
    { title: "Gestion utilisateurs", url: "/owner/users", icon: Users },
    { title: "Journal d'audit", url: "/owner/audit-logs", icon: ScrollText },
    { title: "Abonnements", url: "/owner/subscriptions", icon: ShieldCheck },
    { title: "Plans tarifaires", url: "/owner/pricing-plans", icon: CreditCard },
    { title: "Leads", url: "/owner/leads", icon: ClipboardList, badge: 6 },
    { title: "API Keys", url: "/owner/api-keys", icon: Key },
  ];

  const supervisorItems: NavEntry[] = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.operations"), url: "/orders", icon: Receipt },
    { title: t("nav.services"), url: "/services", icon: Droplets },
    { title: "المداخل", url: "/entries", icon: ClipboardList },
    { title: t("nav.employees"), url: "/employees", icon: UserCog },
    { title: t("nav.customers"), url: "/customers", icon: Users },
    { title: "فريق العمل", url: "/team", icon: UserPlus },
    { title: "طلبات الانضمام", url: "/dashboard/join-requests", icon: UserPlus },
    { title: t("nav.invoices"), url: "/invoices", icon: FileText },
    { title: t("nav.finance"), url: "/finance", icon: Wallet },
    { title: t("nav.reports"), url: "/reports", icon: BarChart3 },
    { title: t("nav.branches"), url: "/branches", icon: Building2 },
    { title: "🎟️ كوبونات", url: "/coupons", icon: Ticket },
    { title: "📧 رسائل", url: "/templates", icon: Mail },
    { title: "🔍 تنقيب", url: "/prospecting", icon: Globe2 },
    { title: t("ds.title"), url: "/data-status", icon: Database },
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];

  const managerItems: NavEntry[] = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.operations"), url: "/orders", icon: Receipt },
    { title: t("nav.services"), url: "/services", icon: Droplets },
    { title: t("nav.employees"), url: "/employees", icon: UserCog },
    { title: t("nav.customers"), url: "/customers", icon: Users },
    { title: t("nav.invoices"), url: "/invoices", icon: FileText },
    { title: t("nav.reports"), url: "/reports", icon: BarChart3 },
    { title: t("nav.branches"), url: "/branches", icon: Building2 },
  ];

  const employeeItems: NavEntry[] = [
    { title: t("nav.services"), url: "/services", icon: Droplets },
    { title: t("nav.invoices"), url: "/invoices", icon: FileText },
  ];

  const items =
    role === "owner" ? ownerItems :
    role === "admin" ? supervisorItems :
    role === "supervisor" ? supervisorItems :
    role === "manager" ? managerItems :
    employeeItems;

  const refCode = (user?.id || "").replace(/-/g, "").slice(-7).toUpperCase() || "GUEST00";
  const roleLabel =
    role === "owner" ? "Propriétaire plateforme" :
    role === "admin" ? "Admin / Propriétaire magasin" :
    role === "supervisor" ? "صاحب المحل" :
    role === "manager" ? "Gérant / Manager" :
    role === "customer" ? "زبون" : t("common.employee");

  return (
    <Sidebar
      collapsible="icon"
      side={isRtl ? "right" : "left"}
      className={`${isRtl ? "border-l" : "border-r"} border-[hsl(220_20%_14%)]`}
      style={{ ["--sidebar-width" as any]: "18rem" }}
    >
      <SidebarContent className="bg-[hsl(220_30%_7%)] p-3 gap-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[hsl(220_20%_20%)] [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Brand header card */}
        <div className="rounded-2xl bg-gradient-to-br from-[hsl(220_30%_12%)] to-[hsl(220_30%_8%)] border border-[hsl(220_20%_18%)] p-3 flex items-center gap-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[hsl(28_90%_55%)] to-[hsl(15_90%_50%)] shadow-[0_0_20px_-4px_hsl(28_90%_55%/0.7)]">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-bold leading-tight text-foreground">Panneau d'administration</h1>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">Control Panel</p>
            </div>
          )}
        </div>

        {/* Administrator card */}
        <div className="rounded-2xl bg-[hsl(220_25%_10%)] border border-[hsl(220_20%_16%)] p-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-[hsl(28_90%_55%/0.15)] border border-[hsl(28_90%_55%/0.4)]">
            <ShieldCheck className="w-5 h-5 text-[hsl(28_95%_65%)]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{profile?.name || "Administrateur"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted-foreground truncate">{roleLabel}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[hsl(28_90%_55%/0.18)] text-[hsl(28_95%_65%)] border border-[hsl(28_90%_55%/0.35)] tabular-nums">
                  {refCode}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nav cards */}
        <nav className="flex flex-col gap-2">
          {items.map((it) => (
            <NavCard key={it.url} item={it} isActive={isPathActive(it.url)} collapsed={collapsed} />
          ))}
          {/* Sidebar toggle — directly below the Settings button */}
          <SidebarTrigger className="w-full h-11 rounded-2xl bg-[hsl(220_25%_10%)] border border-[hsl(220_20%_16%)] hover:bg-[hsl(220_25%_14%)] text-foreground/80" />
        </nav>

        {/* Logout footer */}
        <button
          onClick={signOut}
          className="mt-auto rounded-2xl px-3 py-3 bg-destructive/10 border border-destructive/30 text-destructive font-semibold text-sm hover:bg-destructive/20 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>

        {!collapsed && currentBranch && (
          <p className="text-[10px] text-muted-foreground/60 text-center truncate">{currentBranch.name}</p>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
