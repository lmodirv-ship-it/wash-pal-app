import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OwnerSidebar } from "@/components/OwnerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Crown } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { ChangePasswordButton } from "@/components/ChangePasswordButton";

export function OwnerLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black relative z-10" dir="rtl">
        <OwnerSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-[hsl(48_95%_55%/0.15)] px-3 md:px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[hsl(48_95%_55%/0.08)] border border-[hsl(48_95%_55%/0.25)]">
                <Crown className="w-4 h-4 text-[hsl(48_95%_65%)]" />
                <span className="text-xs font-bold text-[hsl(48_95%_70%)] tracking-wide">
                  PLATFORM OWNER
                </span>
              </div>

              <div className="flex-1" />

              {user?.email && (
                <span className="hidden md:inline text-xs text-muted-foreground">
                  {user.email}
                </span>
              )}

              <NotificationBell />
              <ChangePasswordButton variant="owner" />

              <Button
                onClick={signOut}
                variant="outline"
                className="h-10 rounded-xl gap-2 border-[hsl(48_95%_55%/0.4)] text-[hsl(48_95%_65%)] hover:bg-[hsl(48_95%_55%/0.1)] hover:text-[hsl(48_95%_75%)]"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <div className="max-w-[1600px] mx-auto animate-in-fade">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
