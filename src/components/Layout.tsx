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
import { Search, LogOut, Eye, Users, TrendingUp, RefreshCw, Globe, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { ChangePasswordButton } from "@/components/ChangePasswordButton";

export function Layout({ children }: { children: ReactNode }) {
  const { branches, currentBranch, setCurrentBranch } = useApp();
  const { isAdmin, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black relative z-10">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* HN-DRIVER style topbar */}
          <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-[hsl(0_0%_12%)] px-3 md:px-5 py-3">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              {/* Country select */}
              <div className="hidden md:flex items-center gap-2 h-10 px-3 rounded-xl bg-[hsl(0_0%_6%)] border border-[hsl(0_0%_14%)] min-w-[140px]">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Select defaultValue="ma">
                  <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0 text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ma">🇲🇦 Maroc</SelectItem>
                    <SelectItem value="es">🇪🇸 Espagne</SelectItem>
                    <SelectItem value="fr">🇫🇷 France</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Branch select */}
              {isAdmin && branches.length > 1 && currentBranch && (
                <div className="hidden md:flex items-center gap-2 h-10 px-3 rounded-xl bg-[hsl(0_0%_6%)] border border-[hsl(0_0%_14%)] min-w-[160px]">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={currentBranch?.id || ""}
                    onValueChange={(v) => {
                      const b = branches.find((br) => br.id === v);
                      if (b) setCurrentBranch(b);
                    }}
                  >
                    <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-md">
                <Search className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  placeholder={t("common.quickSearch") || "Rechercher..."}
                  className={`${isRtl ? "pr-9" : "pl-9"} h-10 bg-[hsl(0_0%_6%)] border-[hsl(0_0%_14%)] rounded-xl text-sm`}
                />
              </div>

              <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-[hsl(0_0%_6%)] border border-[hsl(0_0%_14%)] text-muted-foreground hover:text-foreground transition">
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Logout pill */}
              <Button
                onClick={signOut}
                className="h-10 rounded-xl gap-2 bg-transparent border-2 border-[hsl(28_90%_55%)] text-[hsl(28_95%_65%)] hover:bg-[hsl(28_90%_55%/0.15)] hover:text-[hsl(28_95%_70%)] font-bold px-4 shadow-[0_0_20px_-6px_hsl(28_90%_55%/0.7)]"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>

              {/* Counters */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[hsl(0_0%_6%)] border border-[hsl(0_0%_14%)]">
                  <Eye className="w-4 h-4 text-[hsl(190_95%_55%)]" />
                  <span className="text-sm font-bold tabular-nums text-foreground">3776</span>
                </div>
                <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[hsl(0_0%_6%)] border border-[hsl(0_0%_14%)]">
                  <Users className="w-4 h-4 text-[hsl(152_70%_55%)]" />
                  <span className="text-sm font-bold tabular-nums text-foreground">1023</span>
                </div>
                <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[hsl(0_0%_6%)] border border-[hsl(0_0%_14%)]">
                  <TrendingUp className="w-4 h-4 text-[hsl(28_95%_65%)]" />
                  <span className="text-sm font-bold tabular-nums text-foreground">106</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(152_70%_55%)] animate-pulse" />
                </div>
              </div>

              <LanguageSwitcher />
              <NotificationBell />
              <ChangePasswordButton variant="admin" />
              {isAdmin && <AdminModeSwitcher />}
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-auto">
            <div className="max-w-[1600px] mx-auto animate-in-fade">
              {children}
            </div>
          </main>

          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
