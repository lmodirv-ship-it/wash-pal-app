import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserPlus, Building2 } from "lucide-react";

export default function JoinShop() {
  const { user, signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    shop_reference_code: "",
  });
  const [loading, setLoading] = useState(false);

  // Already authenticated → straight to the request flow (skip signup)
  const submitRequestForCurrentUser = async () => {
    const { data, error } = await supabase.rpc("submit_join_request", {
      _reference_code: form.shop_reference_code.trim().toUpperCase(),
      _full_name: form.full_name.trim(),
      _phone: form.phone.trim(),
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shop_reference_code.trim()) {
      toast.error("الرجاء إدخال رقم تعريف المحل");
      return;
    }
    setLoading(true);
    try {
      // 1. If not signed in, create account
      if (!user) {
        const { error } = await signUp(form.email, form.password, form.full_name);
        if (error) throw new Error(error);
        // Wait briefly for auth state to propagate
        await new Promise((r) => setTimeout(r, 800));
      }

      // 2. Submit join request via RPC
      await submitRequestForCurrentUser();

      toast.success("تم إرسال طلبك بنجاح. بانتظار موافقة المسؤول.");
      navigate("/pending-approval", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "تعذر إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" dir="rtl">
      <div className="absolute top-4 end-4 z-20"><LanguageSwitcher /></div>
      <div className="absolute inset-0 bg-[#030308]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,95,255,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(250,204,21,0.05)_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-[0_0_50px_hsl(var(--primary)/0.4)]">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">انضم إلى متجر</h1>
          <p className="text-sm text-muted-foreground mt-1">سجل بصفة موظف باستخدام رقم تعريف المحل</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#060612]/80 backdrop-blur-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-foreground text-center">طلب انضمام موظف جديد</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">رقم تعريف المحل (مثال: SH-123456)</label>
              <Input
                type="text"
                placeholder="SH-XXXXXX"
                value={form.shop_reference_code}
                onChange={(e) => setForm((f) => ({ ...f, shop_reference_code: e.target.value.toUpperCase() }))}
                className="bg-[#0a0a1e] border-white/8 text-foreground h-11 font-mono tracking-wider focus:border-primary/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">الاسم الكامل</label>
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40" required />
            </div>

            {!user && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">البريد الإلكتروني</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">كلمة السر (6 أحرف فأكثر)</label>
                  <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40" required minLength={6} />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">رقم الهاتف</label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="bg-[#0a0a1e] border-white/8 text-foreground h-11 focus:border-primary/40" required />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 font-bold text-base bg-gradient-to-r from-[#0a0a2a] to-[#12122e] border border-white/10 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(250,204,21,0.12)] transition-all duration-500">
              <span className="flex items-center justify-center gap-2 text-foreground">
                <UserPlus className="w-5 h-5" />
                {loading ? "جاري الإرسال..." : "إرسال طلب الانضمام"}
              </span>
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              لديك حساب بالفعل؟{" "}
              <Link to="/login" className="text-primary hover:underline">تسجيل الدخول</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}