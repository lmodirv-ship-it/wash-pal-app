import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Bell } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { branches, currentBranch, setCurrentBranch } = useApp();
  const { profile, isAdmin } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative z-10">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 h-16 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="hover:bg-muted rounded-lg" />
              <div className="hidden sm:block min-w-0">
                <p className="text-[11px] text-muted-foreground">مرحباً</p>
                <p className="text-sm font-semibold text-foreground truncate">{profile?.name || 'مستخدم'} 👋</p>
              </div>
            </div>

            {/* Global search */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث سريع..."
                  className="pr-9 h-10 bg-muted/50 border-transparent focus-visible:bg-card focus-visible:border-border rounded-xl text-sm"
                />
                <kbd className="hidden lg:inline-flex absolute left-2 top-1/2 -translate-y-1/2 items-center gap-1 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-destructive" />
              </button>
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
