import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AdminModeSwitcher } from "@/components/AdminModeSwitcher";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Bell, LogOut, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

export function Layout({ children }: { children: ReactNode }) {
  const { branches, currentBranch, setCurrentBranch } = useApp();
  const { profile, isAdmin, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative z-10">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-16 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="hover:bg-muted rounded-lg" />
              <BrandLogo size={36} />
              <div className="hidden sm:block min-w-0">
                <p className="text-[11px] text-muted-foreground">{t("common.welcome")}</p>
                <p className="text-sm font-semibold text-foreground truncate">{profile?.name || t("common.user")} 👋</p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  placeholder={t("common.quickSearch")}
                  className={`${isRtl ? "pr-9" : "pl-9"} h-10 bg-muted/50 border-transparent focus-visible:bg-card focus-visible:border-border rounded-xl text-sm`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {isAdmin && <AdminModeSwitcher />}
              {isAdmin && (
                <Button asChild size="sm" variant="outline" className="h-10 rounded-xl gap-2 hidden sm:flex border-primary/30 text-primary hover:bg-primary/10">
                  <Link to="/create-shop"><Plus className="w-4 h-4" /><span className="hidden md:inline">متجر جديد</span></Link>
                </Button>
              )}
              {isAdmin && branches.length > 1 && currentBranch && (
                <Select
                  value={currentBranch?.id || ""}
                  onValueChange={(v) => {
                    const b = branches.find((br) => br.id === v);
                    if (b) setCurrentBranch(b);
                  }}
                >
                  <SelectTrigger className="w-40 h-10 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
                <Bell className="w-[18px] h-[18px]" />
                <span className={`absolute top-2 ${isRtl ? "left-2" : "right-2"} w-2 h-2 rounded-full bg-destructive`} />
              </button>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-auto">
            <div className="max-w-7xl mx-auto animate-in-fade">
              {children}
            </div>
          </main>

          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
