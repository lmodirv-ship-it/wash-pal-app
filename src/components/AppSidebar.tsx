import {
  LayoutDashboard, Receipt, Users, UserCog, Droplets,
  FileText, BarChart3, Building2, Settings, Store, LogOut, Wallet, UserPlus, ShieldCheck, CreditCard, Package, ClipboardList, Globe2,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

function NavItem({ item, collapsed, isActive }: { item: { title: string; url: string; icon: any }; collapsed: boolean; isActive: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <NavLink
          to={item.url}
          end={item.url === "/"}
          className={`group relative rounded-xl py-2.5 px-3 transition-all duration-200
            ${isActive
              ? "bg-primary/10 text-primary font-semibold"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
            }`}
          activeClassName=""
        >
          <item.icon className={`mx-2 h-[18px] w-[18px] flex-shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
          {!collapsed && <span className="text-sm">{item.title}</span>}
          {isActive && !collapsed && (
            <span className="absolute end-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-l-full" />
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function Group({ label, items, collapsed, isPathActive }: { label?: string; items: any[]; collapsed: boolean; isPathActive: (u: string) => boolean }) {
  if (!items.length) return null;
  return (
    <SidebarGroup>
      {!collapsed && label && (
        <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-3 mt-3">{label}</SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5 px-2">
          {items.map((item) => <NavItem key={item.url} item={item} collapsed={collapsed} isActive={isPathActive(item.url)} />)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { currentBranch } = useApp();
  const { profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const role = profile?.role || "employee";

  const isPathActive = (url: string) => url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  // ---------- Build menus per role ----------
  const adminPlatform = [
    { title: "لوحة المنصة", url: "/admin", icon: ShieldCheck },
    { title: "اشتراكات المحلات", url: "/admin/subscriptions", icon: CreditCard },
    { title: "باقات الأسعار", url: "/admin/pricing-plans", icon: Package },
    { title: "🌍 توليد عملاء", url: "/admin/leads", icon: Globe2 },
  ];

  const supervisorOverview = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.operations"), url: "/orders", icon: Receipt },
  ];
  const supervisorManage = [
    { title: t("nav.services"), url: "/services", icon: Droplets },
    { title: "المداخل", url: "/entries", icon: ClipboardList },
    { title: t("nav.employees"), url: "/employees", icon: UserCog },
    { title: t("nav.customers"), url: "/customers", icon: Users },
    { title: "فريق العمل", url: "/team", icon: UserPlus },
  ];
  const supervisorBusiness = [
    { title: t("nav.invoices"), url: "/invoices", icon: FileText },
    { title: t("nav.finance"), url: "/finance", icon: Wallet },
    { title: t("nav.reports"), url: "/reports", icon: BarChart3 },
    { title: t("nav.branches"), url: "/branches", icon: Building2 },
  ];
  const supervisorSettings = [{ title: t("nav.settings"), url: "/settings", icon: Settings }];

  // Manager: same as supervisor minus team mgmt + finance restricted
  const managerOverview = supervisorOverview;
  const managerManage = [
    { title: t("nav.services"), url: "/services", icon: Droplets },
    { title: "المداخل", url: "/entries", icon: ClipboardList },
    { title: t("nav.employees"), url: "/employees", icon: UserCog },
    { title: t("nav.customers"), url: "/customers", icon: Users },
  ];
  const managerBusiness = [
    { title: t("nav.invoices"), url: "/invoices", icon: FileText },
    { title: t("nav.reports"), url: "/reports", icon: BarChart3 },
    { title: t("nav.branches"), url: "/branches", icon: Building2 },
  ];

  const employeeItems = [
    { title: t("nav.services"), url: "/services", icon: Droplets },
    { title: t("nav.invoices"), url: "/invoices", icon: FileText },
  ];

  const renderMenu = () => {
    if (role === "admin") {
      return (
        <>
          <Group label="إدارة المنصة" items={adminPlatform} collapsed={collapsed} isPathActive={isPathActive} />
          <Group label={t("nav.overview")} items={supervisorOverview} collapsed={collapsed} isPathActive={isPathActive} />
          <Group label={t("nav.management")} items={[...supervisorManage, { title: t("nav.shops"), url: "/shops", icon: Store }]} collapsed={collapsed} isPathActive={isPathActive} />
          <Group label={t("nav.business")} items={supervisorBusiness} collapsed={collapsed} isPathActive={isPathActive} />
          <Group items={supervisorSettings} collapsed={collapsed} isPathActive={isPathActive} />
        </>
      );
    }
    if (role === "supervisor") {
      return (
        <>
          <Group label={t("nav.overview")} items={supervisorOverview} collapsed={collapsed} isPathActive={isPathActive} />
          <Group label={t("nav.management")} items={supervisorManage} collapsed={collapsed} isPathActive={isPathActive} />
          <Group label={t("nav.business")} items={supervisorBusiness} collapsed={collapsed} isPathActive={isPathActive} />
          <Group items={supervisorSettings} collapsed={collapsed} isPathActive={isPathActive} />
        </>
      );
    }
    if (role === "manager") {
      return (
        <>
          <Group label={t("nav.overview")} items={managerOverview} collapsed={collapsed} isPathActive={isPathActive} />
          <Group label={t("nav.management")} items={managerManage} collapsed={collapsed} isPathActive={isPathActive} />
          <Group label={t("nav.business")} items={managerBusiness} collapsed={collapsed} isPathActive={isPathActive} />
        </>
      );
    }
    // employee / customer / fallback
    return <Group items={employeeItems} collapsed={collapsed} isPathActive={isPathActive} />;
  };

  const roleLabel =
    role === "admin" ? "مدير المنصة" :
    role === "supervisor" ? "صاحب المحل" :
    role === "manager" ? "مسير" :
    role === "customer" ? "زبون" : t("common.employee");

  return (
    <Sidebar collapsible="icon" side={isRtl ? "right" : "left"} className={`${isRtl ? "border-l" : "border-r"} border-sidebar-border bg-sidebar`}>
      <SidebarContent className="bg-sidebar">
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} />
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">HN Carwash</h1>
                <p className="text-[11px] text-muted-foreground truncate">{currentBranch?.name || "—"}</p>
              </div>
            )}
          </div>
        </div>

        {renderMenu()}

        <div className="mt-auto p-3 border-t border-sidebar-border">
          {!collapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'var(--gradient-primary)' }}>
                {(profile?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{profile?.name || t("common.user")}</p>
                <p className="text-[10px] text-muted-foreground truncate">{roleLabel}</p>
              </div>
              <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-destructive transition-colors" title={t("nav.logout")}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={signOut} className="w-full flex justify-center p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
