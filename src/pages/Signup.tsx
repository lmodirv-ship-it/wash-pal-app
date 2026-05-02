import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getStoredReferralCode, clearStoredReferralCode } from "@/hooks/useReferralTracking";
import { trackEvent } from "@/lib/analytics";

export default function Signup() {
  const { signUp, user, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const nextParam = searchParams.get("next");
  const redirectTo = nextParam || (redirectParam === "create-shop" ? "/create-shop" : redirectParam ? `/${redirectParam}` : "/post-login");

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    // Referral attribution + analytics
    const refCode = getStoredReferralCode();
    if (refCode) {
      try {
        await supabase.from("referral_events").insert({ code: refCode, event_type: "signup" });
        // best-effort increment via update
        const { data: ses } = await supabase.auth.getUser();
        if (ses?.user) {
          await supabase.rpc("track_referral_click", { _code: refCode }); // no-op duplicate guard
        }
      } catch {}
      clearStoredReferralCode();
    }
    trackEvent("sign_up", { method: "email", referral: !!refCode });
    toast.success("تم إنشاء الحساب بنجاح 🎉");
    // auto-confirm enabled → user is signed in immediately, the Navigate above will trigger
    setLoading(false);
  };

  const isRtl = i18n.language === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute top-4 end-4 z-20"><LanguageSwitcher /></div>
      <div className="absolute inset-0 bg-[#030308]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,95,255,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(250,204,21,0.05)_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-[0_0_50px_hsl(var(--primary)/0.4)]">
            <span className="text-3xl font-black text-primary-foreground">H&L</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">H&Lavage</h1>
          <p className="text-sm text-muted-foreground mt-1">إنشاء حساب جديد</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#060612]/80 backdrop-blur-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-foreground text-center">تسجيل جديد</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">الاسم الكامل</label>
              <Input type="text" placeholder="محمد علي" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40 focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">البريد الإلكتروني</label>
              <Input type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40 focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">كلمة السر (6 أحرف فأكثر)</label>
              <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40 focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all" required minLength={6} />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 font-bold text-base relative overflow-hidden group bg-gradient-to-r from-[#0a0a2a] to-[#12122e] border border-white/10 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(250,204,21,0.12)] transition-all duration-500">
              <span className="relative text-foreground group-hover:text-primary transition-colors duration-300">
                {loading ? "جاري إنشاء الحساب..." : (
                  <span className="flex items-center justify-center gap-2"><UserPlus className="w-5 h-5" />إنشاء حساب</span>
                )}
              </span>
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              لديك حساب بالفعل؟{" "}
              <Link to={`/login${redirectParam ? `?redirect=${redirectParam}` : ""}`} className="text-primary hover:underline">
                تسجيل الدخول
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
