import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, Shield, CreditCard,
  Database, Megaphone, Settings, Crown, ScrollText, Sparkles, KeyRound, FileText
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
      { title: "المستخدمون والأدوار", url: "/owner/users", icon: Users },
      { title: "سجل الأدوار", url: "/owner/audit-logs", icon: ScrollText },
    ],
  },
  {
    label: "الأمان والامتثال",
    items: [
      { title: "الأمان", url: "/owner/security", icon: Shield },
      { title: "سجل التدقيق", url: "/owner/activity", icon: FileText },
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
          <SidebarGroup key={g.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-[hsl(48_95%_55%/0.5)]">
                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`${
                            active
                              ? "bg-[hsl(48_95%_55%/0.12)] text-[hsl(48_95%_70%)] border-r-2 border-[hsl(48_95%_55%)]"
                              : "text-muted-foreground hover:bg-[hsl(220_25%_10%)] hover:text-foreground"
                          } transition-all`}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
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
