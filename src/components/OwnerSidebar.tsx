import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, Shield, CreditCard,
  Database, Megaphone, Settings, Crown, ScrollText, Sparkles, KeyRound, FileText, Download, Droplets
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const groups: { label: string; items: { title: string; url: string; icon: any }[] }[] = [
  {
    label: "نظرة عامة",
    items: [
      { title: "لوحة التحكم", url: "/owner", icon: LayoutDashboard },
    ],
  },
  {
    label: "إدارة المنصة",
    items: [
      { title: "المتاجر", url: "/owner/shops", icon: Building2 },
      { title: "الخدمات", url: "/owner/services", icon: Droplets },
      { title: "المستخدمون والأدوار", url: "/owner/users", icon: Users },
      { title: "سجل الأدوار", url: "/owner/role-audit-logs", icon: ScrollText },
    ],
  },
  {
    label: "الأمان والامتثال",
    items: [
      { title: "الأمان", url: "/owner/security", icon: Shield },
      { title: "سجل التدقيق", url: "/owner/activity", icon: FileText },
      { title: "تصدير البيانات", url: "/owner/exports", icon: Download },
    ],
  },
  {
    label: "الفوترة",
    items: [
      { title: "الاشتراكات", url: "/owner/subscriptions", icon: CreditCard },
      { title: "خطط الأسعار", url: "/owner/pricing-plans", icon: Sparkles },
      { title: "العملاء المحتملون", url: "/owner/leads", icon: Crown },
    ],
  },
  {
    label: "النظام",
    items: [
      { title: "قاعدة البيانات", url: "/owner/database", icon: Database },
      { title: "الإشعارات والإعلانات", url: "/owner/notifications", icon: Megaphone },
      { title: "مفاتيح API", url: "/owner/api-keys", icon: KeyRound },
      { title: "الإعدادات العامة", url: "/owner/settings", icon: Settings },
    ],
  },
];

export function OwnerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string) =>
    url === "/owner" ? pathname === "/owner" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-l border-[hsl(48_95%_55%/0.15)] bg-[hsl(220_30%_4%)]">
      <SidebarContent>
        <div className="px-4 pt-4 pb-3 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(48_95%_55%)] to-[hsl(28_95%_55%)] flex items-center justify-center shadow-[0_0_18px_-4px_hsl(48_95%_55%/0.7)]">
            <Crown className="w-5 h-5 text-black" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[hsl(48_95%_70%)]">Owner Console</span>
              <span className="text-[10px] text-muted-foreground">Platform Admin</span>
            </div>
          )}
        </div>

        {groups.map((g) => (
          <SidebarGroup key={g.label} className="px-2 py-2">
            {!collapsed && (
              <SidebarGroupLabel className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(48_95%_60%/0.7)]">
                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        className="h-11 min-h-[44px] rounded-xl p-0 hover:bg-transparent data-[active=true]:bg-transparent"
                      >
                        <NavLink
                          to={item.url}
                          className={[
                            "group relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium",
                            "transition-all duration-200 ease-out",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(48_95%_60%/0.7)] focus-visible:ring-offset-0",
                            active
                              ? "border border-[hsl(48_95%_55%/0.45)] bg-gradient-to-l from-[hsl(48_95%_55%/0.28)] via-[hsl(40_95%_55%/0.18)] to-[hsl(28_95%_55%/0.10)] text-[hsl(48_100%_92%)] shadow-[0_0_0_1px_hsl(48_95%_55%/0.22),0_10px_28px_-10px_hsl(40_95%_55%/0.55)]"
                              : "border border-transparent text-zinc-300/85 hover:border-[hsl(48_95%_55%/0.18)] hover:bg-[hsl(48_95%_55%/0.08)] hover:text-[hsl(48_100%_88%)]",
                          ].join(" ")}
                        >
                          <item.icon
                            className={[
                              "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                              active
                                ? "text-[hsl(48_100%_70%)] drop-shadow-[0_0_6px_hsl(48_95%_55%/0.55)]"
                                : "text-[hsl(48_30%_70%/0.75)] group-hover:text-[hsl(48_95%_70%)]",
                            ].join(" ")}
                          />
                          {!collapsed && (
                            <span className="truncate text-[13px] leading-none">{item.title}</span>
                          )}
                          {active && !collapsed && (
                            <span
                              aria-hidden
                              className="ms-auto h-1.5 w-1.5 rounded-full bg-[hsl(48_100%_65%)] shadow-[0_0_8px_hsl(48_95%_55%/0.85)]"
                            />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
