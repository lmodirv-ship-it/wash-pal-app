import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Sparkles, Zap, Crown, Building2, ArrowRight, MessageCircle, Gift, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { openWhatsAppUpgrade, PAYMENT_WHATSAPP_DISPLAY } from "@/lib/whatsapp";

type Cycle = "monthly" | "yearly";
type PlanId = "starter" | "pro" | "business" | "enterprise";

interface Plan {
  id: PlanId;
  name: string;
  arName: string;
  tagline: string;
  monthly: number;
  yearly: number;
  startingFrom?: boolean;
  credits: string;
  badge?: string;
  highlight?: boolean;
  icon: typeof Sparkles;
  accent: string; // tailwind color class for ring/icon
  cta: string;
  features: { label: string; included: boolean }[];
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    arName: "بداية",
    tagline: "مناسبة للمغاسل الصغيرة أو للانطلاق",
    monthly: 99,
    yearly: 990,
    credits: "300 عملية / شهر",
    icon: Sparkles,
    accent: "emerald",
    cta: "ابدأ الآن",
    features: [
      { label: "فرع واحد", included: true },
      { label: "حتى 3 موظفين", included: true },
      { label: "300 عملية شهرياً", included: true },
      { label: "تقارير أساسية", included: true },
      { label: "إشعارات WhatsApp", included: false },
      { label: "تحليلات متقدمة", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    arName: "احترافي",
    tagline: "الأكثر اختياراً للمغاسل المتوسطة",
    monthly: 199,
    yearly: 1990,
    credits: "1000 عملية / شهر",
    badge: "الأكثر اختياراً",
    highlight: true,
    icon: Zap,
    accent: "yellow",
    cta: "ابدأ الآن",
    features: [
      { label: "حتى 3 فروع", included: true },
      { label: "حتى 10 موظفين", included: true },
      { label: "1000 عملية شهرياً", included: true },
      { label: "تقارير متقدمة", included: true },
      { label: "إشعارات Email + WhatsApp", included: true },
      { label: "API خاص", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    arName: "متقدم",
    tagline: "للمغاسل الكبيرة والتوسع",
    monthly: 399,
    yearly: 3990,
    credits: "5000 عملية / شهر",
    icon: Crown,
    accent: "blue",
    cta: "اختر الباقة",
    features: [
      { label: "فروع غير محدودة", included: true },
      { label: "موظفون غير محدودون", included: true },
      { label: "5000 عملية شهرياً", included: true },
      { label: "تحليلات متقدمة جداً", included: true },
      { label: "تقارير مالية مفصلة", included: true },
      { label: "إشعارات Email + WhatsApp", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    arName: "شركات",
    tagline: "حلول مخصصة للشركات الكبرى",
    monthly: 799,
    yearly: 7990,
    startingFrom: true,
    credits: "نقاط حسب الطلب",
    icon: Building2,
    accent: "rose",
    cta: "تواصل معنا",
    features: [
      { label: "عدد كبير من الفروع", included: true },
      { label: "API خاص", included: true },
      { label: "خصائص مخصصة", included: true },
      { label: "دعم مميز 24/7", included: true },
      { label: "تكامل مع أنظمتك", included: true },
      { label: "مدير حساب مخصص", included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { feature: "الفروع", starter: "1", pro: "3", business: "غير محدود", enterprise: "غير محدود" },
  { feature: "الموظفون", starter: "3", pro: "10", business: "غير محدود", enterprise: "غير محدود" },
  { feature: "العمليات / شهر", starter: "300", pro: "1,000", business: "5,000", enterprise: "حسب الطلب" },
  { feature: "تقارير متقدمة", starter: false, pro: true, business: true, enterprise: true },
  { feature: "إشعارات WhatsApp", starter: false, pro: true, business: true, enterprise: true },
  { feature: "API خاص", starter: false, pro: false, business: false, enterprise: true },
  { feature: "دعم فني", starter: "بريد", pro: "بريد + WhatsApp", business: "أولوية", enterprise: "مدير مخصص 24/7" },
];

const FAQS = [
  {
    q: "ما هو نظام النقاط (Credits)؟",
    a: "كل عملية (طلب/فاتورة) تخصم نقطة واحدة من رصيد باقتك الشهري. النقاط تتجدد تلقائياً مع بداية كل دورة فوترة.",
  },
  {
    q: "هل أحتاج بطاقة ائتمان للتجربة المجانية؟",
    a: "لا. كل محل جديد يحصل على 15 يوم تجربة مجانية كاملة بدون دفع وبدون التزام، يمكنك تجربة كل الميزات.",
  },
  {
    q: "كيف يتم الدفع؟",
    a: `الدفع يتم يدوياً عبر WhatsApp على الرقم ${PAYMENT_WHATSAPP_DISPLAY}. اضغط على زر الباقة وستفتح محادثة جاهزة للترقية.`,
  },
  {
    q: "هل يمكنني تغيير الباقة لاحقاً؟",
    a: "نعم. يمكنك الترقية أو التخفيض في أي وقت من خلال التواصل معنا عبر WhatsApp.",
  },
  {
    q: "ماذا يحدث عند انتهاء التجربة؟",
    a: "سيتحول حسابك إلى وضع القراءة فقط. بياناتك محفوظة وتستطيع الاطلاع عليها، لكن لإنشاء عمليات جديدة يجب اختيار باقة.",
  },
  {
    q: "كم خصم الباقة السنوية؟",
    a: "الفوترة السنوية توفر لك حوالي شهرين مجاناً (~17%) مقارنة بالشهرية.",
  },
];

const accentMap: Record<string, { ring: string; bg: string; text: string; glow: string }> = {
  emerald: {
    ring: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    glow: "shadow-[0_0_30px_-10px_rgb(16_185_129_/_0.4)]",
  },
  yellow: {
    ring: "border-primary/60",
    bg: "bg-primary/10",
    text: "text-primary",
    glow: "shadow-[0_0_50px_-10px_hsl(var(--primary)/0.6)]",
  },
  blue: {
    ring: "border-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    glow: "shadow-[0_0_30px_-10px_rgb(59_130_246_/_0.4)]",
  },
  rose: {
    ring: "border-rose-500/40",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    glow: "shadow-[0_0_30px_-10px_rgb(244_63_94_/_0.4)]",
  },
};

export default function Pricing() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<Cycle>("yearly");

  const handleSelect = (planId: PlanId) => {
    try {
      localStorage.setItem("selectedPlan", JSON.stringify({ plan: planId, cycle }));
    } catch {}
    if (planId === "starter") {
      navigate(`/login?redirect=create-shop`);
    } else {
      openWhatsAppUpgrade({ plan: planId as any, cycle });
    }
  };

  const yearlySavingsPct = (p: Plan) => {
    if (p.monthly === 0) return 0;
    const monthlyTotal = p.monthly * 12;
    return Math.round(((monthlyTotal - p.yearly) / monthlyTotal) * 100);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-14 text-center">
          <Badge variant="outline" className="mb-6 bg-primary/10 border-primary/30 text-primary">
            <Gift className="w-3 h-3 ml-1" />
            🎉 15 يوم تجربة مجانية لكل محل جديد
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            باقات H&Lavage 💳
            <br />
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
              اختر الأنسب لمغسلتك
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            ابدأ بـ 15 يوم تجربة مجانية كاملة. بدون بطاقة. بدون التزام. ألغِ متى شئت.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full p-1.5 shadow-lg">
            <button
              onClick={() => setCycle("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                cycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              شهري
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                cycle === "yearly"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              سنوي
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                وفّر 17%
              </Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const a = accentMap[plan.accent];
            const price = cycle === "yearly" ? Math.round(plan.yearly / 12) : plan.monthly;
            const savings = yearlySavingsPct(plan);
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 border-2",
                  plan.highlight
                    ? `${a.ring} bg-gradient-to-b from-primary/10 to-card ${a.glow} lg:scale-[1.04]`
                    : `border-border bg-card hover:${a.ring} hover:${a.glow}`
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg px-3 py-1 whitespace-nowrap">
                      ⭐ {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", a.bg, a.text)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold leading-tight">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.arName}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-5 min-h-[2.5rem]">{plan.tagline}</p>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {plan.startingFrom && (
                      <span className="text-xs text-muted-foreground">من</span>
                    )}
                    <span className="text-4xl font-extrabold">{price}</span>
                    <span className="text-sm text-muted-foreground">د.م / شهر</span>
                  </div>
                  {cycle === "yearly" && plan.yearly > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {plan.yearly.toLocaleString()} د.م / سنة{" "}
                      {savings > 0 && (
                        <span className="text-emerald-400 font-semibold">— وفّر {savings}%</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Credits chip */}
                <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 mb-5 text-xs font-medium", a.bg, a.text)}>
                  <Coins className="w-3.5 h-3.5" />
                  {plan.credits}
                </div>

                <Button
                  onClick={() => handleSelect(plan.id)}
                  size="lg"
                  className={cn(
                    "w-full rounded-xl font-semibold mb-4 group",
                    plan.id === "starter"
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg"
                  )}
                >
                  {plan.id === "starter" ? (
                    <>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 mr-2 rtl:rotate-180" />
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 ml-2" />
                      اشترك عبر WhatsApp
                    </>
                  )}
                </Button>

                <ul className="space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className={cn("w-4 h-4 shrink-0 mt-0.5", a.text)} />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span className={cn(!f.included && "text-muted-foreground/60 line-through")}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* WhatsApp footer note */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          📞 الدفع والترقية عبر WhatsApp:{" "}
          <span dir="ltr" className="font-semibold text-foreground">{PAYMENT_WHATSAPP_DISPLAY}</span>
        </p>
      </section>

      {/* Credits system explainer */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_40px_-5px_hsl(var(--primary)/0.5)]">
              <Coins className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">⚡ نظام النقاط (Credits)</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                تعتمد المنصة على نظام نقاط ذكي: <span className="text-foreground font-semibold">كل عملية = نقطة واحدة</span>،
                وكل باقة تحتوي على رصيد شهري يتجدد تلقائياً. كلما كبرت باقتك، زادت عملياتك المتاحة شهرياً.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-border/50">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          مقارنة شاملة بين الباقات
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-right min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 font-semibold">الميزة</th>
                <th className="p-4 font-semibold">Starter</th>
                <th className="p-4 font-semibold text-primary">Pro ⭐</th>
                <th className="p-4 font-semibold text-blue-400">Business</th>
                <th className="p-4 font-semibold text-rose-400">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-medium">{row.feature}</td>
                  {(["starter", "pro", "business", "enterprise"] as const).map((col) => {
                    const val = (row as any)[col];
                    return (
                      <td key={col} className="p-4">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/40" />
                          )
                        ) : (
                          <span className="text-sm">{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16 border-t border-border/50">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          الأسئلة الشائعة ❓
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border bg-card rounded-xl px-5 data-[state=open]:border-primary/40"
            >
              <AccordionTrigger className="text-right hover:no-underline font-semibold">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-br from-primary/20 via-card to-card border border-primary/30 rounded-3xl p-10 md:p-14 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">جاهز للبدء؟ 🚀</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            احصل على 15 يوم تجربة مجانية كاملة. بدون بطاقة. بدون التزام.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => handleSelect("starter")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base rounded-xl shadow-lg"
            >
              ابدأ التجربة المجانية
              <ArrowRight className="w-4 h-4 mr-2 rtl:rotate-180" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleSelect("pro")}
              className="px-8 h-12 text-base rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              تواصل عبر WhatsApp
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
