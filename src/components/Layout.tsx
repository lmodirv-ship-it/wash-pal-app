import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { branches, currentBranch, setCurrentBranch } = useApp();
  const { signOut, profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 gap-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
              {profile && (
                <span className="text-sm text-muted-foreground">
                  مرحباً، <span className="text-foreground font-medium">{profile.name || 'مستخدم'}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {branches.length > 1 && currentBranch && (
                <Select
                  value={currentBranch?.id || ""}
                  onValueChange={(v) => {
                    const b = branches.find((br) => br.id === v);
                    if (b) setCurrentBranch(b);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="ghost" size="icon" onClick={signOut} title="تسجيل الخروج">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
