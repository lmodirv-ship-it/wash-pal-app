import {
  LayoutDashboard, ClipboardList, Users, UserCog, Droplets,
  FileText, BarChart3, Building2, Settings, Store, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

const adminItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard },
  { title: "الطلبات", url: "/orders", icon: ClipboardList },
  { title: "العملاء", url: "/customers", icon: Users },
  { title: "الموظفين", url: "/employees", icon: UserCog },
  { title: "الخدمات", url: "/services", icon: Droplets },
  { title: "الفواتير", url: "/invoices", icon: FileText },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
  { title: "الفروع", url: "/branches", icon: Building2 },
  { title: "المحلات", url: "/shops", icon: Store },
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

const employeeItems = [
  { title: "الخدمات", url: "/services", icon: Droplets },
  { title: "الفواتير", url: "/invoices", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { currentBranch } = useApp();
  const { isAdmin, signOut } = useAuth();

  const items = isAdmin ? adminItems : employeeItems;

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarContent className="bg-[#030310] border-l border-white/5">
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0
              shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
              <span className="text-sm font-black text-primary-foreground">H&L</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-foreground">H&Lavage</h1>
                <p className="text-xs text-muted-foreground">{currentBranch?.name || "..."}</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2 pt-2">
              {items.map((item) => {
                const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`group relative overflow-hidden rounded-xl py-2.5 px-3 transition-all duration-500
                          border border-transparent
                          ${isActive
                            ? "bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(250,204,21,0.12)] text-primary"
                            : "hover:bg-white/[0.03] hover:border-white/8 text-muted-foreground hover:text-foreground"
                          }`}
                        activeClassName=""
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                        )}
                        <item.icon className={`ml-2 h-5 w-5 relative z-10 transition-all duration-300 ${isActive ? "text-primary drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "group-hover:text-primary/70"}`} />
                        {!collapsed && (
                          <span className={`relative z-10 font-medium transition-all duration-300 ${isActive ? "text-primary" : "group-hover:text-foreground"}`}>
                            {item.title}
                          </span>
                        )}
                        {isActive && !collapsed && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-l-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign out */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 rounded-xl py-2.5 px-3 text-destructive/70 hover:text-destructive
              hover:bg-destructive/5 border border-transparent hover:border-destructive/20 transition-all duration-300 text-sm"
          >
            <LogOut className="h-4 w-4 ml-1" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
