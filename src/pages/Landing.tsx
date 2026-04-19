import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import {
  Sparkles, BarChart3, Users, TrendingUp, Brain, Check,
  Star, ArrowRight, Zap, Shield, Globe
} from "lucide-react";

export default function Landing() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <div className="min-h-screen bg-[#030308] text-foreground overflow-x-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,95,255,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(250,204,21,0.06)_0%,transparent_50%)]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 border-b border-white/5 backdrop-blur-xl bg-[#030308]/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              <span className="text-sm font-black text-primary-foreground">H&L</span>
            </div>
            <span className="font-bold text-lg">CarwashPro</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login">
              <Button variant="ghost" size="sm">تسجيل الدخول</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                ابدأ مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-24 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8 animate-in-fade">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">نظام إدارة المغاسل الأذكى لعام 2026</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
            CarwashPro
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              نظام إدارة المغاسل الأشمل
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            أدر مغسلتك، تابع الإيرادات، ونمِّ أعمالك بسهولة تامة — كل شيء في منصة واحدة.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="h-14 px-8 text-base font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] transition-all duration-500 group">
                ابدأ مجاناً
                <ArrowRight className={`w-5 h-5 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"} transition-transform`} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold border-white/10 bg-white/[0.02] hover:bg-white/[0.05]">
                تسجيل الدخول
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20">
            {[
              { v: "+500", l: "مغسلة" },
              { v: "99.9%", l: "وقت التشغيل" },
              { v: "24/7", l: "دعم فني" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">كل ما تحتاجه لإدارة مغسلتك</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">أدوات قوية مصممة بدقة لتمنحك التحكم الكامل في عملياتك اليومية</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: "لوحة تحكم فورية", desc: "متابعة الأداء والإيرادات في الوقت الحقيقي" },
              { icon: Users, title: "تتبع الموظفين", desc: "قياس أداء الفريق وتحسين الإنتاجية" },
              { icon: TrendingUp, title: "تحليلات الإيرادات", desc: "تقارير ذكية لفهم نمو أعمالك" },
              { icon: Brain, title: "رؤى ذكية", desc: "توصيات مدعومة بالذكاء الاصطناعي" },
            ].map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--primary)/0.08)]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual / Dashboard preview */}
      <section className="relative z-10 px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4">واجهة مصممة لتسهيل عملك</h2>
            <p className="text-muted-foreground">تصميم عصري يجمع بين الجمال والوظيفية</p>
          </div>
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-2 shadow-[0_0_80px_hsl(var(--primary)/0.1)]">
            <div className="rounded-2xl bg-[#060612] p-6 md:p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "الطلبات اليوم", value: "127", color: "from-blue-500/20 to-blue-500/5" },
                  { label: "الإيرادات", value: "12.4K", color: "from-primary/20 to-primary/5" },
                  { label: "الموظفون", value: "18", color: "from-emerald-500/20 to-emerald-500/5" },
                  { label: "العملاء", value: "342", color: "from-purple-500/20 to-purple-500/5" },
                ].map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${s.color} border border-white/5`}>
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className="text-2xl font-black">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="h-48 rounded-xl bg-gradient-to-t from-primary/10 to-transparent border border-white/5 flex items-end p-4 gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-primary/40" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">باقات تناسب جميع الأحجام</h2>
            <p className="text-muted-foreground">ابدأ مجاناً وارتقِ مع نمو أعمالك</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "0", period: "مجاناً", features: ["مغسلة واحدة", "حتى 3 موظفين", "تقارير أساسية", "دعم بالبريد"], highlight: false, icon: Zap },
              { name: "Pro", price: "299", period: "/شهرياً", features: ["حتى 3 فروع", "موظفون غير محدودين", "تحليلات متقدمة", "دعم فني 24/7", "تطبيق العملاء"], highlight: true, icon: Sparkles },
              { name: "Business", price: "699", period: "/شهرياً", features: ["فروع غير محدودة", "API كامل", "ذكاء اصطناعي", "مدير حساب مخصص", "تكاملات حسب الطلب"], highlight: false, icon: Shield },
            ].map((p, i) => (
              <div key={i} className={`relative p-8 rounded-2xl border transition-all duration-500 ${p.highlight ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_60px_hsl(var(--primary)/0.15)] scale-105" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    الأكثر طلباً
                  </div>
                )}
                <p.icon className={`w-8 h-8 mb-4 ${p.highlight ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period === "مجاناً" ? "" : "DH"}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block">
                  <Button className={`w-full h-11 font-bold ${p.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-white/5 hover:bg-white/10 text-foreground border border-white/10"}`}>
                    اختر {p.name}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">يثق بنا أصحاب المغاسل</h2>
            <p className="text-muted-foreground">تجارب حقيقية من عملائنا</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "أحمد بنعلي", role: "صاحب مغسلة، الدار البيضاء", text: "غيّر CarwashPro طريقة إدارتي تماماً. أصبحت أرى كل شيء في مكان واحد." },
              { name: "سعاد المرابط", role: "مديرة سلسلة مغاسل، الرباط", text: "التقارير الذكية ساعدتنا على زيادة الإيرادات بنسبة 35% خلال 3 أشهر." },
              { name: "كريم الفاسي", role: "صاحب مغسلتين، طنجة", text: "الدعم الفني ممتاز والتطبيق سلس جداً. أنصح به بقوة." },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent">
          <Globe className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black mb-4">جاهز للانطلاق؟</h2>
          <p className="text-muted-foreground mb-8">انضم لمئات أصحاب المغاسل الذين يثقون في CarwashPro</p>
          <Link to="/login">
            <Button size="lg" className="h-14 px-10 text-base font-bold bg-primary text-primary-foreground hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
              ابدأ الآن مجاناً
              <ArrowRight className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-sm font-black text-primary-foreground">H&L</span>
              </div>
              <span className="font-bold">CarwashPro</span>
            </div>
            <p className="text-sm text-muted-foreground">نظام إدارة المغاسل الأشمل في المغرب</p>
          </div>
          {[
            { title: "المنتج", links: ["الميزات", "الباقات", "التحديثات"] },
            { title: "الشركة", links: ["من نحن", "تواصل معنا", "المدونة"] },
            { title: "قانوني", links: ["الشروط", "الخصوصية", "ملفات تعريف الارتباط"] },
          ].map((c, i) => (
            <div key={i}>
              <h4 className="font-bold text-sm mb-4">{c.title}</h4>
              <ul className="space-y-2">
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 text-center text-xs text-muted-foreground">
          © 2026 CarwashPro — H&Lavage. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
