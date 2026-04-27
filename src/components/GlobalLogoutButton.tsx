import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Floating global logout button.
 * Visible on every page when the user is authenticated, EXCEPT on routes
 * whose layout already has its own logout button (admin /dashboard, /owner,
 * employee /dashboard/work & /dashboard/services), to avoid duplicates.
 */
export function GlobalLogoutButton() {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  // Routes that already render their own logout button in the header/topnav.
  const HIDE_ON_PREFIXES = [
    "/dashboard",   // admin Layout has logout (covers /dashboard, /dashboard/work, /dashboard/services, /dashboard/join-requests)
    "/owner",       // OwnerLayout has logout
    "/orders", "/customers", "/employees", "/services", "/entries",
    "/invoices", "/reports", "/finance", "/branches", "/shops",
    "/settings", "/team", "/prospecting", "/templates", "/coupons",
    "/data-status", "/join-requests",
    // Public/auth pages
    "/login", "/signup", "/forgot-password", "/reset-password",
    "/start", "/pricing", "/", "/landing", "/invite",
  ];
  const shouldHide = HIDE_ON_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (shouldHide) return null;

  const isRtl = i18n.language === "ar";

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signOut();
      toast.success(t("auth.signedOut", { defaultValue: "تم تسجيل الخروج" }));
      navigate("/login", { replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Error");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label={t("auth.signOut", { defaultValue: "تسجيل الخروج" })}
      className={`fixed bottom-24 md:bottom-6 ${isRtl ? "left-4" : "right-4"} z-[60]
        inline-flex items-center gap-2 h-11 px-4 rounded-full
        bg-[hsl(0_75%_50%)] text-white font-bold text-sm
        shadow-[0_8px_30px_-4px_hsl(0_75%_50%/0.6)]
        hover:bg-[hsl(0_80%_55%)] hover:scale-105 active:scale-95
        transition-all border-2 border-[hsl(0_85%_65%/0.4)]
        disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <LogOut className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
      <span>{t("auth.signOut", { defaultValue: "تسجيل الخروج" })}</span>
    </button>
  );
}

export default GlobalLogoutButton;