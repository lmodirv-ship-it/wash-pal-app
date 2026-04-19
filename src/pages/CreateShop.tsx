import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const PLANS = [
  { id: "starter", name: "Starter", price: "مجاني", desc: "متجر واحد، 100 طلب/شهر" },
  { id: "pro", name: "Pro", price: "299 د.م/شهر", desc: "حتى 3 فروع، طلبات غير محدودة" },
  { id: "business", name: "Business", price: "799 د.م/شهر", desc: "متاجر متعددة، ميزات متقدمة" },
];

export default function CreateShop() {
  const { user, loading: authLoading } = useAuth();
  const { setCurrentShopId, refreshAll, tenantShops, loading: appLoading } = useApp();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const [form, setForm] = useState({
    shop_name: "",
    manager_name: "",
    phone: "",
    address: "",
    city: "",
    plan: "starter",
  });
  const [loading, setLoading] = useState(false);

  if (!authLoading && !user) return <Navigate to="/login?next=/create-shop" replace />;
  // Edge case: already has shops → straight to dashboard
  if (!authLoading && !appLoading && user && tenantShops.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.shop_name.trim() || !form.manager_name.trim()) {
      toast.error("اسم المتجر واسم المدير مطلوبان");
      return;
    }
    setLoading(true);
    try {
      const { data: shop, error: shopErr } = await supabase
        .from("shops")
        .insert({ name: form.shop_name.trim(), owner_id: user.id, created_by: user.id })
        .select()
        .single();
      if (shopErr || !shop) throw shopErr || new Error("فشل إنشاء المتجر");

      // owner is auto-added as supervisor by trigger; ensure it explicitly too
      await supabase.from("shop_members").upsert(
        { shop_id: shop.id, user_id: user.id, role: "supervisor" },
        { onConflict: "shop_id,user_id" } as any
      );

      // optional: create a default branch with the contact info
      if (form.address.trim() || form.phone.trim()) {
        await supabase.from("branches").insert({
          shop_id: shop.id,
          name: form.shop_name.trim(),
          address: form.address.trim() || form.city.trim() || "—",
          phone: form.phone.trim() || "—",
          is_active: true,
        });
      }

      setCurrentShopId(shop.id);
      await refreshAll();
      toast.success("تم إنشاء متجرك بنجاح 🎉");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء إنشاء المتجر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030308] relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,95,255,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(250,204,21,0.05)_0%,transparent_50%)]" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> رجوع
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">أنشئ متجرك</h1>
          <p className="text-sm text-muted-foreground mt-2">ابدأ رحلتك مع CarwashPro في أقل من دقيقة</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/8 bg-[#060612]/80 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">اسم المتجر *</Label>
              <Input
                value={form.shop_name}
                onChange={(e) => setForm((f) => ({ ...f, shop_name: e.target.value }))}
                placeholder="H&Lavage Casablanca"
                className="bg-[#0a0a1e] border-white/8 h-11"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">اسم المدير *</Label>
              <Input
                value={form.manager_name}
                onChange={(e) => setForm((f) => ({ ...f, manager_name: e.target.value }))}
                placeholder="محمد العلوي"
                className="bg-[#0a0a1e] border-white/8 h-11"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">الهاتف</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+212 6 00 00 00 00"
                className="bg-[#0a0a1e] border-white/8 h-11"
                maxLength={30}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">المدينة</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="الدار البيضاء"
                className="bg-[#0a0a1e] border-white/8 h-11"
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">العنوان</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="شارع محمد الخامس، رقم 12"
                className="bg-[#0a0a1e] border-white/8 h-11"
                maxLength={200}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">باقة الاشتراك</Label>
            <RadioGroup
              value={form.plan}
              onValueChange={(v) => setForm((f) => ({ ...f, plan: v }))}
              className="grid md:grid-cols-3 gap-3"
            >
              {PLANS.map((p) => (
                <label
                  key={p.id}
                  htmlFor={`plan-${p.id}`}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    form.plan === p.id
                      ? "border-primary/60 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                      : "border-white/8 bg-[#0a0a1e] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-foreground">{p.name}</span>
                    <RadioGroupItem value={p.id} id={`plan-${p.id}`} />
                  </div>
                  <p className="text-sm text-primary font-semibold">{p.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-bold text-base bg-gradient-to-r from-primary/80 to-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin mx-2" /> جاري الإنشاء...</>
            ) : (
              "إنشاء المتجر"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
