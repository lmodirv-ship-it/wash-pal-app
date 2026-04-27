import { useNavigate, useLocation } from "react-router-dom";
import { Globe, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "adminMode"; // "platform" | "shop"

export function getAdminMode(): "platform" | "shop" {
  return (localStorage.getItem(STORAGE_KEY) as any) || "platform";
}

export function AdminModeSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPlatform = location.pathname.startsWith("/owner");

  const switchTo = (mode: "platform" | "shop") => {
    localStorage.setItem(STORAGE_KEY, mode);
    navigate(mode === "platform" ? "/owner" : "/dashboard");
  };

  return (
    <div className="hidden md:inline-flex items-center bg-muted/50 border border-border rounded-xl p-0.5 h-10">
      <button
        onClick={() => switchTo("platform")}
        className={cn(
          "flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-all",
          isPlatform ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Globe className="w-3.5 h-3.5" />
        المنصة
      </button>
      <button
        onClick={() => switchTo("shop")}
        className={cn(
          "flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-all",
          !isPlatform ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Store className="w-3.5 h-3.5" />
        متجري
      </button>
    </div>
  );
}
