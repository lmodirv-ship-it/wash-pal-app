import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2, Loader2, ArrowLeft, ArrowRight, Check, Rocket,
  Sparkles, Shield, Zap, Star, BarChart3, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const PLANS = [
  { id: "starter", name: "Starter", price: "0", period: "مجاني للأبد", desc: "متجر واحد، حتى 100 طلب/شهر", icon: Zap },
  { id: "pro", name: "Pro", price: "299", period: "د.م/شهر", desc: "حتى 3 فروع، طلبات غير محدودة", icon: Sparkles, popular: true },
  { id: "business", name: "Business", price: "799", period: "د.م/شهر", desc: "متاجر متعددة، ذكاء اصطناعي", icon: Shield },
];

const shopSchema = z.object({
  shop_name: z.string().trim().min(2, "اسم المتجر قصير جداً").max(100, "اسم المتجر طويل جداً"),
  manager_name: z.string().trim().min(2, "اسم المدير قصير جداً").max(100, "اسم المدير طويل جداً"),
  phone: z.string().trim().max(30, "رقم الهاتف طويل").optional().or(z.literal("")),
  city: z.string().trim().max(80, "اسم المدينة طويل").optional().or(z.literal("")),
  plan: z.enum(["starter", "pro", "business"]),
});

const STEPS = [
  { n: 1, title: "معلومات المتجر", desc: "الاسم والمدير" },
  { n: 2, title: "تفاصيل التواصل", desc: "الهاتف والمدينة" },
  { n: 3, title: "اختر باقتك", desc: "خطة الاشتراك" },
];

export default function CreateShop() {
  const { user, loading: authLoading } = useAuth();
  const { setCurrentShopId, refreshAll, tenantShops, loading: appLoading } = useApp();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  // Pre-select plan + cycle from /pricing if user came from there
  const preselected = (() => {
    try {
      const raw = localStorage.getItem("selectedPlan");
      if (!raw) return null;
      return JSON.parse(raw) as { plan: "starter" | "pro" | "business"; cycle: "monthly" | "yearly" };
    } catch { return null; }
  })();

  const [step, setStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(preselected?.cycle || "monthly");
  const [form, setForm] = useState({
    shop_name: "", manager_name: "", phone: "", city: "",
    plan: (preselected?.plan || "starter") as "starter" | "pro" | "business",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!authLoading && !user) return <Navigate to="/login?next=/create-shop" replace />;
  if (!authLoading && !appLoading && user && tenantShops.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (form.shop_name.trim().length < 2) e.shop_name = "اسم المتجر مطلوب (حرفان على الأقل)";
      if (form.manager_name.trim().length < 2) e.manager_name = "اسم المدير مطلوب (حرفان على الأقل)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => { if (validateStep(step)) setStep((s) => Math.min(3, s + 1)); };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!user) return;
    const result = shopSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      toast.error("يرجى مراجعة البيانات");
      return;
    }
    setLoading(true);
    try {
      const { data: shop, error: shopErr } = await supabase
        .from("shops")
        .insert({ name: form.shop_name.trim(), owner_id: user.id, created_by: user.id })
        .select().single();
      if (shopErr || !shop) throw shopErr || new Error("فشل إنشاء المتجر");

      await supabase.from("shop_members").upsert(
        { shop_id: shop.id, user_id: user.id, role: "supervisor" },
        { onConflict: "shop_id,user_id" } as any
      );

      if (form.phone.trim() || form.city.trim()) {
        await supabase.from("branches").insert({
          shop_id: shop.id,
          name: form.shop_name.trim(),
          address: form.city.trim() || "—",
          phone: form.phone.trim() || "—",
          is_active: true,
        });
      }

      // Seed default services so the new shop has something to start with.
      // The owner can edit names/prices or delete them from the Services page.
      const DEFAULT_SERVICES = [
        { name: "غسيل خارجي",                 name_ar: "غسيل خارجي",            name_fr: "Lavage extérieur",        name_en: "Exterior wash",       price: 30,  duration: 15, category: "standard" },
        { name: "غسيل داخلي",                 name_ar: "غسيل داخلي",            name_fr: "Nettoyage intérieur",     name_en: "Interior cleaning",   price: 40,  duration: 20, category: "standard" },
        { name: "غسيل شامل (داخلي + خارجي)",  name_ar: "غسيل شامل",             name_fr: "Lavage complet",          name_en: "Full wash",           price: 60,  duration: 30, category: "standard" },
        { name: "تلميع الكاروسري",            name_ar: "تلميع الكاروسري",       name_fr: "Polissage carrosserie",   name_en: "Body polish",         price: 120, duration: 45, category: "premium"  },
        { name: "تنظيف المحرك",               name_ar: "تنظيف المحرك",          name_fr: "Nettoyage moteur",        name_en: "Engine cleaning",     price: 80,  duration: 30, category: "premium"  },
        { name: "تشميع",                      name_ar: "تشميع",                 name_fr: "Cirage",                  name_en: "Waxing",              price: 100, duration: 30, category: "premium"  },
        { name: "تنظيف المقاعد بالبخار",      name_ar: "تنظيف المقاعد بالبخار", name_fr: "Nettoyage sièges vapeur", name_en: "Steam seat cleaning", price: 150, duration: 60, category: "premium"  },
      ];
      await supabase.from("services").insert(
        DEFAULT_SERVICES.map((s) => ({
          shop_id: shop.id,
          name: s.name, name_ar: s.name_ar, name_fr: s.name_fr, name_en: s.name_en,
          price: s.price, duration: s.duration, category: s.category,
          description: "", is_active: true, starting_from: false,
        }))
      );

      // Update auto-created trial subscription with chosen plan + correct price
      const PRICE_MAP: Record<string, { monthly: number; yearly: number }> = {
        starter:  { monthly: 0,   yearly: 0 },
        pro:      { monthly: 199, yearly: 1990 },
        business: { monthly: 499, yearly: 4790 },
      };
      const monthly_price = billingCycle === "yearly"
        ? Math.round(PRICE_MAP[form.plan].yearly / 12)
        : PRICE_MAP[form.plan].monthly;
      await supabase.from("subscriptions").update({
        plan: form.plan,
        billing_cycle: billingCycle,
        monthly_price,
      }).eq("shop_id", shop.id);

      try { localStorage.removeItem("selectedPlan"); } catch {}

      setCurrentShopId(shop.id);
      await refreshAll();
      toast.success("🎉 تم إنشاء متجرك بنجاح!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء إنشاء المتجر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900" dir={isRtl ? "rtl" : "ltr"}>
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* ============ LEFT: Branding & Preview ============ */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          {/* gradient decoration */}
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/40 to-cyan-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-200/30 blur-3xl" />

          <div className="relative">
            <Link to="/" className="flex items-center gap-2.5 mb-12 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <span className="text-sm font-black text-white">H&L</span>
              </div>
              <span className="font-bold text-slate-900 text-lg">CarwashPro</span>
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight text-slate-900 mb-4"
            >
              ابدأ إدارة مغسلتك
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                اليوم 🚗
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-slate-600 text-lg leading-relaxed max-w-md"
            >
              أنشئ متجرك في أقل من دقيقة وابدأ بمتابعة إيراداتك، فريقك، وعملائك من لوحة واحدة.
            </motion.p>
          </div>

          {/* Dashboard mock preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="relative my-10"
          >
            <div className="rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-blue-500/10 p-4">
              <div className="flex items-center gap-1.5 pb-3">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><BarChart3 className="w-3 h-3" />الإيرادات</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">12,480 DH</div>
                  <div className="text-[10px] font-bold text-emerald-600">+18% ↗</div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><TrendingUp className="w-3 h-3" />السيارات</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">127</div>
                  <div className="text-[10px] font-bold text-emerald-600">+12% ↗</div>
                </div>
              </div>
              <div className="h-20 rounded-xl bg-gradient-to-t from-blue-50 to-transparent border border-slate-100 flex items-end gap-1 p-2">
                {[40, 65, 50, 80, 60, 90, 75, 100, 70, 95, 82, 88].map((h, i) => (
                  <motion.div
                    key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ delay: 0.5 + i * 0.04, duration: 0.5 }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="relative p-5 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-md"
          >
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">"غيّر CarwashPro طريقة إدارتي تماماً. كل شيء أصبح في مكان واحد."</p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black">أ</div>
              <div>
                <div className="text-xs font-bold text-slate-900">أحمد بنعلي</div>
                <div className="text-[10px] text-slate-500">صاحب مغسلة، الدار البيضاء</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ============ RIGHT: Form ============ */}
        <div className="flex flex-col p-6 md:p-10 lg:p-12">
          {/* mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25">
              <span className="text-xs font-black text-white">H&L</span>
            </div>
            <span className="font-bold text-slate-900">CarwashPro</span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors w-fit"
          >
            <ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} /> رجوع
          </button>

          <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
            {/* Mobile title */}
            <div className="lg:hidden mb-8">
              <h1 className="text-3xl font-black text-slate-900 mb-2">أنشئ متجرك 🚗</h1>
              <p className="text-slate-600">في أقل من دقيقة</p>
            </div>

            {/* Stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {STEPS.map((s, i) => (
                  <div key={s.n} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-black transition-all shrink-0 ${
                      step > s.n
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                        : step === s.n
                          ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30 scale-110"
                          : "bg-slate-100 text-slate-400"
                    }`}>
                      {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-all ${step > s.n ? "bg-emerald-500" : "bg-slate-200"}`} />
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">الخطوة {step} من {STEPS.length}</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{STEPS[step - 1].title}</h2>
                <p className="text-sm text-slate-500">{STEPS[step - 1].desc}</p>
              </div>
            </div>

            {/* Form card */}
            <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">اسم المتجر *</Label>
                      <Input
                        value={form.shop_name}
                        onChange={(e) => { setForm((f) => ({ ...f, shop_name: e.target.value })); setErrors((er) => ({ ...er, shop_name: "" })); }}
                        placeholder="H&Lavage Casablanca"
                        className={`h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 transition-all ${errors.shop_name ? "border-red-300 bg-red-50" : ""}`}
                        maxLength={100} autoFocus
                      />
                      {errors.shop_name && <p className="text-xs text-red-500 font-medium">{errors.shop_name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">اسم المدير *</Label>
                      <Input
                        value={form.manager_name}
                        onChange={(e) => { setForm((f) => ({ ...f, manager_name: e.target.value })); setErrors((er) => ({ ...er, manager_name: "" })); }}
                        placeholder="محمد العلوي"
                        className={`h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 transition-all ${errors.manager_name ? "border-red-300 bg-red-50" : ""}`}
                        maxLength={100}
                      />
                      {errors.manager_name && <p className="text-xs text-red-500 font-medium">{errors.manager_name}</p>}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">الهاتف</Label>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+212 6 00 00 00 00"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 transition-all"
                        maxLength={30} autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">المدينة</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        placeholder="الدار البيضاء"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 transition-all"
                        maxLength={80}
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">💡 اختياري — يمكنك إضافتها لاحقاً من الإعدادات</p>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    {PLANS.map((p) => {
                      const selected = form.plan === p.id;
                      return (
                        <label
                          key={p.id}
                          className={`relative cursor-pointer block rounded-2xl border-2 p-4 transition-all ${
                            selected
                              ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio" name="plan" value={p.id} checked={selected}
                            onChange={() => setForm((f) => ({ ...f, plan: p.id as any }))}
                            className="sr-only"
                          />
                          {p.popular && (
                            <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-black shadow-md">
                              ⭐ الأكثر شعبية
                            </span>
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              selected ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                              <p.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="font-bold text-slate-900">{p.name}</span>
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-lg font-black text-slate-900">{p.price}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">{p.period}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600">{p.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              selected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    {form.plan !== "starter" && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
                        💬 سيتم إنشاء محلك بـ <strong>15 يوم تجربة مجانية</strong>. لتفعيل باقة <strong>{form.plan === "pro" ? "Pro" : "Business"}</strong> بشكل دائم، تواصل معنا عبر WhatsApp:{" "}
                        <span dir="ltr" className="font-bold">0668546358</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-8">
                {step > 1 && (
                  <Button
                    type="button" variant="outline" onClick={goBack} disabled={loading}
                    className="h-12 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 px-5"
                  >
                    <ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                    السابق
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    type="button" onClick={goNext}
                    className="flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-lg shadow-blue-500/25 transition-all group"
                  >
                    التالي
                    <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"} transition-transform`} />
                  </Button>
                ) : (
                  <Button
                    type="button" onClick={handleSubmit} disabled={loading}
                    className="flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-lg shadow-blue-500/30 transition-all"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإنشاء...</>
                    ) : (
                      <>إنشاء المتجر <Rocket className="w-4 h-4" /></>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              بإنشاء متجر، أنت توافق على <a href="#" className="text-blue-600 hover:underline">الشروط</a> و<a href="#" className="text-blue-600 hover:underline">سياسة الخصوصية</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
