import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
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

type Cycle = "monthly" | "yearly";
type PlanId = "starter" | "pro" | "business";

interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number; // total per year
  badge?: string;
  highlight?: boolean;
  icon: typeof Sparkles;
  cta: string;
  features: { label: string; included: boolean }[];
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "ابدأ مجاناً واختبر النظام",
    monthly: 0,
    yearly: 0,
    icon: Sparkles,
    cta: "ابدأ مجاناً",
    features: [
      { label: "موظف واحد فقط", included: true },
      { label: "ميزات أساسية", included: true },
      { label: "فاتورة واحدة في كل وقت", included: true },
      { label: "تقارير ذكية", included: false },
      { label: "تحليلات متقدمة", included: false },
      { label: "متعدد الفروع", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "الخيار الأكثر شعبية للأعمال النامية",
    monthly: 199,
    yearly: 1990, // ~17% off
    badge: "الأكثر شيوعاً",
    highlight: true,
    icon: Zap,
    cta: "ابدأ الآن",
    features: [
      { label: "حتى 5 موظفين", included: true },
      { label: "لوحة تحكم كاملة", included: true },
      { label: "إدارة الموظفين والعملاء", included: true },
      { label: "تحليلات أساسية", included: true },
      { label: "تقارير عبر البريد", included: true },
      { label: "متعدد الفروع", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "للشركات الكبيرة بدون حدود",
    monthly: 499,
    yearly: 4790, // ~20% off
    icon: Crown,
    cta: "اختر الباقة",
    features: [
      { label: "موظفون غير محدودين", included: true },
      { label: "متعدد الفروع", included: true },
      { label: "تحليلات متقدمة + AI", included: true },
      { label: "تصدير البيانات", included: true },
      { label: "تقارير Email + WhatsApp", included: true },
      { label: "دعم فني ذو أولوية", included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { feature: "عدد الموظفين", starter: "1", pro: "5", business: "غير محدود" },
  { feature: "متعدد الفروع", starter: false, pro: false, business: true },
  { feature: "التحليلات", starter: false, pro: "أساسية", business: "متقدمة" },
  { feature: "التقارير التلقائية", starter: false, pro: "Email", business: "Email + WhatsApp" },
  { feature: "تصدير البيانات", starter: false, pro: false, business: true },
  { feature: "دعم فني", starter: "مجتمعي", pro: "بريد", business: "أولوية 24/7" },
];

const FAQS = [
  {
    q: "هل أحتاج بطاقة ائتمان للتجربة المجانية؟",
    a: "لا. التجربة المجانية لمدة 15 يوماً لا تتطلب أي بطاقة. ستحصل تلقائياً على باقة Starter عند إنشاء متجرك.",
  },
  {
    q: "هل يمكنني تغيير الباقة في أي وقت؟",
    a: "نعم. يمكنك الترقية أو التخفيض في أي وقت من إعدادات الاشتراك، والتغيير يسري فوراً.",
  },
  {
    q: "ماذا يحدث عند انتهاء التجربة؟",
    a: "سيتحول حسابك إلى وضع القراءة فقط. يمكنك الاطلاع على بياناتك لكن لن تتمكن من إنشاء عمليات جديدة حتى تختار باقة.",
  },
  {
    q: "هل هناك عقود طويلة الأجل؟",
    a: "لا. جميع باقاتنا شهرية أو سنوية، ويمكنك الإلغاء في أي وقت دون أي رسوم خفية.",
  },
  {
    q: "كم خصم الباقة السنوية؟",
    a: "الفوترة السنوية توفر لك حتى 20% مقارنة بالشهرية، أي شهرين مجاناً تقريباً.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<Cycle>("yearly");

  const handleSelect = (planId: PlanId) => {
    try {
      localStorage.setItem("selectedPlan", JSON.stringify({ plan: planId, cycle }));
    } catch {}
    navigate(`/login?redirect=create-shop`);
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
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-14 text-center">
          <Badge variant="outline" className="mb-6 bg-primary/10 border-primary/30 text-primary">
            <Sparkles className="w-3 h-3 ml-1" />
            تجربة مجانية 15 يوماً
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            اختر الباقة المناسبة
            <br />
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
              لأعمالك 💰
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            ابدأ بتجربة مجانية لمدة 15 يوماً. لا حاجة لبطاقة ائتمان. ألغِ في أي وقت.
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
                وفّر 20%
              </Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = cycle === "yearly" ? Math.round(plan.yearly / 12) : plan.monthly;
            const savings = yearlySavingsPct(plan);
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative p-7 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
                  plan.highlight
                    ? "border-primary/60 bg-gradient-to-b from-primary/10 to-card shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)] scale-[1.02]"
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg px-3 py-1">
                      ⭐ {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center",
                      plan.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6 min-h-[2.5rem]">{plan.tagline}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold">{price}</span>
                    <span className="text-muted-foreground">د.ج / شهر</span>
                  </div>
                  {cycle === "yearly" && plan.yearly > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      تُحاسَب سنوياً ({plan.yearly.toLocaleString()} د.ج){" "}
                      {savings > 0 && (
                        <span className="text-emerald-400 font-semibold">— وفّر {savings}%</span>
                      )}
                    </p>
                  )}
                  {plan.monthly === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">للأبد، بدون رسوم</p>
                  )}
                </div>

                <Button
                  onClick={() => handleSelect(plan.id)}
                  size="lg"
                  className={cn(
                    "w-full rounded-xl font-semibold mb-6 group",
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  )}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
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
      </section>

      {/* Comparison table */}
      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-border/50">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          مقارنة الباقات بالتفصيل
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 font-semibold">الميزة</th>
                <th className="p-4 font-semibold">Starter</th>
                <th className="p-4 font-semibold text-primary">Pro</th>
                <th className="p-4 font-semibold">Business</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-medium">{row.feature}</td>
                  {(["starter", "pro", "business"] as const).map((col) => {
                    const val = row[col];
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
            ابدأ تجربتك المجانية اليوم. بدون بطاقة. بدون التزام.
          </p>
          <Button
            size="lg"
            onClick={() => handleSelect("pro")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base rounded-xl shadow-lg"
          >
            ابدأ تجربتك المجانية
            <ArrowRight className="w-4 h-4 mr-2 rtl:rotate-180" />
          </Button>
        </div>
      </section>
    </div>
  );
}
