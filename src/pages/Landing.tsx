import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/* ---------- Auth-aware Start Free wrapper ---------- */
function StartFreeLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const target = user ? "/create-shop" : "/signup?redirect=create-shop";
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(target);
  };
  return (
    <a href={target} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, BarChart3, Users, TrendingUp, Brain, Check, Star,
  ArrowRight, Zap, Shield, Smartphone, Building2, Play,
  PlusCircle, Receipt, Rocket
} from "lucide-react";

/* ---------- Animated counter ---------- */
function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);
  const [val, setVal] = useState(`${prefix}0${suffix}`);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration: 1.6, ease: "easeOut" });
    const u = rounded.on("change", setVal);
    return () => { c.stop(); u(); };
  }, [inView, to, mv, rounded]);
  return <span ref={ref}>{val}</span>;
}

/* ---------- Section fade-up ---------- */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
} as const;

export default function Landing() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden" dir={isRtl ? "rtl" : "ltr"} style={{ scrollBehavior: "smooth" }}>
      {/* ===== Sticky Nav ===== */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25">
              <span className="text-sm font-black text-white">H&L</span>
            </div>
            <span className="font-bold text-slate-900">CarwashPro</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">الميزات</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">الأسعار</a>
            <a href="#how" className="hover:text-slate-900 transition-colors">كيف يعمل</a>
            <a href="#testimonials" className="hover:text-slate-900 transition-colors">الآراء</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                تسجيل الدخول
              </Button>
            </Link>
            <StartFreeLink>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-md shadow-blue-500/25 rounded-xl">
                ابدأ مجاناً
              </Button>
            </StartFreeLink>
          </div>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* gradient bg */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white to-white" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-gradient-to-r from-blue-200/40 via-cyan-200/40 to-blue-200/40 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left text */}
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">جديد · نظام إدارة المغاسل 2026</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-slate-900 mb-6">
              أدر مغسلتك
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                باحترافية كاملة 🚗
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
              تابع الإيرادات، أدر فريقك، ونمِّ أعمالك بسلاسة مع CarwashPro — منصة واحدة لكل ما تحتاجه.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3">
              <StartFreeLink>
                <Button size="lg" className="h-13 px-7 text-base font-semibold rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-lg shadow-blue-500/30 group">
                  ابدأ مجاناً
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"} transition-transform`} />
                </Button>
              </StartFreeLink>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-13 px-7 text-base font-semibold rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <Play className="w-4 h-4" />
                  شاهد العرض
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 mt-8 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> بدون بطاقة ائتمان</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> إعداد بدقيقتين</div>
            </motion.div>
          </motion.div>

          {/* Right dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-2xl shadow-blue-500/10 p-3">
              {/* window chrome */}
              <div className="flex items-center gap-1.5 px-3 pb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4">
                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "الإيرادات اليوم", value: "12,480 DH", trend: "+18%", color: "from-blue-500 to-cyan-500" },
                    { label: "السيارات", value: "127", trend: "+12%", color: "from-emerald-500 to-teal-500" },
                  ].map((k, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[11px] text-slate-500">{k.label}</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">{k.value}</div>
                      <div className={`text-[10px] font-bold bg-gradient-to-r ${k.color} bg-clip-text text-transparent`}>{k.trend} هذا الأسبوع</div>
                    </div>
                  ))}
                </div>
                {/* Chart */}
                <div className="h-32 rounded-xl bg-gradient-to-t from-blue-50 to-transparent border border-slate-100 flex items-end gap-1.5 p-3">
                  {[30, 55, 40, 70, 50, 85, 65, 78, 60, 92, 72, 100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.6 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                    />
                  ))}
                </div>
                {/* List row */}
                <div className="space-y-2">
                  {[
                    { car: "AB-123-45", svc: "غسيل شامل", price: "120 DH", status: "مكتمل" },
                    { car: "CD-456-78", svc: "غسيل سريع", price: "60 DH", status: "قيد العمل" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">{r.car.slice(0, 2)}</div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{r.car}</div>
                          <div className="text-[10px] text-slate-500">{r.svc}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">{r.price}</div>
                        <div className="text-[10px] text-emerald-600">{r.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="absolute -left-6 top-20 hidden md:flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500">نمو شهري</div>
                <div className="text-sm font-black text-slate-900">+34.2%</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="absolute -right-4 bottom-16 hidden md:flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-600 fill-blue-600" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500">رضا العملاء</div>
                <div className="text-sm font-black text-slate-900">4.9 / 5</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== Trust bar ===== */}
      <section className="py-12 px-6 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">يستخدمها أكثر من 500 مغسلة في المغرب</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {["AquaShine", "ProWash", "ClearCar", "EcoWash", "ShinyDrive", "FastClean"].map((n) => (
              <div key={n} className="text-lg font-black text-slate-400 tracking-tight">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
              <span className="text-xs font-semibold text-blue-700">الميزات</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">أدوات قوية ومتكاملة مصممة بدقة لمساعدتك على إدارة مغسلتك بكفاءة تامة</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "لوحة تحكم فورية", desc: "تابع أداء مغسلتك لحظة بلحظة مع بيانات حية ودقيقة." },
              { icon: Users, title: "تتبع الموظفين", desc: "قِس أداء كل موظف وحفّز فريقك لتحقيق أفضل النتائج." },
              { icon: TrendingUp, title: "تحليلات الإيرادات", desc: "تقارير مفصّلة وذكية لفهم نمو أعمالك واتجاهاتك." },
              { icon: Brain, title: "رؤى ذكية", desc: "توصيات مدعومة بالذكاء الاصطناعي لتحسين عملياتك." },
              { icon: Building2, title: "جاهز لعدة فروع", desc: "أدر فروعك المتعددة من لوحة واحدة وبكل سهولة." },
              { icon: Smartphone, title: "متوافق مع الجوال", desc: "تجربة سلسة على الهاتف والحاسوب — أينما كنت." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="group p-7 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-5 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Animated counters ===== */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { to: 500, suffix: "+", label: "مغسلة نشطة" },
            { to: 1200000, label: "سيارة معالجة" },
            { to: 99, suffix: "%", label: "وقت التشغيل" },
            { to: 24, suffix: "/7", label: "دعم فني" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="text-4xl md:text-5xl font-black tracking-tight">
                <Counter to={s.to} suffix={s.suffix || ""} />
              </div>
              <div className="text-xs uppercase tracking-wider text-white/80 mt-2 font-semibold">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">ابدأ في 3 خطوات بسيطة</h2>
            <p className="text-slate-600">من التسجيل إلى النمو — نحن معك في كل خطوة</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
            {[
              { icon: PlusCircle, n: "01", title: "أضف خدماتك", desc: "أنشئ قائمة الخدمات والأسعار في دقائق." },
              { icon: Receipt, n: "02", title: "تابع المعاملات", desc: "سجّل الطلبات وتابع حالتها لحظة بلحظة." },
              { icon: Rocket, n: "03", title: "نمِّ أعمالك", desc: "حلّل الأداء واتخذ قرارات أذكى." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative text-center p-8 rounded-2xl bg-white border border-slate-100"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center relative">
                  <s.icon className="w-7 h-7 text-blue-600" />
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-black">{s.n}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">أسعار شفافة، بدون مفاجآت</h2>
            <p className="text-slate-600">اختر الباقة المناسبة لحجم أعمالك</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {[
              { name: "Starter", price: "0", period: "مجاناً للأبد", icon: Zap, features: ["مغسلة واحدة", "حتى 3 موظفين", "تقارير أساسية", "دعم بالبريد الإلكتروني"], highlight: false },
              { name: "Pro", price: "299", period: "/شهرياً", icon: Sparkles, features: ["حتى 3 فروع", "موظفون غير محدودين", "تحليلات متقدمة", "دعم فني 24/7", "تطبيق العملاء", "API الوصول"], highlight: true },
              { name: "Business", price: "699", period: "/شهرياً", icon: Shield, features: ["فروع غير محدودة", "API كامل", "ذكاء اصطناعي متقدم", "مدير حساب مخصص", "تكاملات حسب الطلب", "SLA مضمون"], highlight: false },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className={`relative p-8 rounded-3xl transition-all duration-300 flex flex-col ${
                  p.highlight
                    ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/30 scale-[1.03]"
                    : "bg-white border border-slate-200 text-slate-900 hover:shadow-xl"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-blue-600 text-[11px] font-black shadow-md">
                    ⭐ الأكثر شعبية
                  </div>
                )}
                <div className="flex items-center justify-between mb-5">
                  <p.icon className={`w-7 h-7 ${p.highlight ? "text-white" : "text-blue-600"}`} />
                  <span className={`text-xs font-bold ${p.highlight ? "text-white/80" : "text-slate-400"}`}>{p.name}</span>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tight">{p.price}</span>
                    <span className={`text-sm ${p.highlight ? "text-white/80" : "text-slate-500"}`}>{p.price !== "0" ? "DH" : ""}</span>
                  </div>
                  <div className={`text-sm mt-1 ${p.highlight ? "text-white/80" : "text-slate-500"}`}>{p.period}</div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${p.highlight ? "text-white" : "text-blue-600"}`} />
                      <span className={p.highlight ? "text-white/90" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <StartFreeLink className="block">
                  <Button className={`w-full h-12 font-bold rounded-xl ${
                    p.highlight
                      ? "bg-white text-blue-600 hover:bg-white/90"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}>
                    اختر {p.name}
                  </Button>
                </StartFreeLink>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">يثقون بنا كل يوم</h2>
            <p className="text-slate-600">قصص نجاح حقيقية من أصحاب المغاسل</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "أحمد بنعلي", role: "صاحب مغسلة، الدار البيضاء", text: "غيّر CarwashPro طريقة إدارتي تماماً. أصبحت أرى كل شيء في مكان واحد ومنظم." },
              { name: "سعاد المرابط", role: "مديرة سلسلة مغاسل، الرباط", text: "التقارير الذكية ساعدتنا على زيادة الإيرادات بنسبة 35% خلال 3 أشهر فقط." },
              { name: "كريم الفاسي", role: "صاحب مغسلتين، طنجة", text: "الدعم الفني ممتاز والتطبيق سلس جداً. أنصح به بقوة لكل صاحب مغسلة." },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-7 rounded-2xl bg-white border border-slate-100 hover:shadow-xl transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6 text-[15px]">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 p-12 md:p-16 text-center text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.3),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">جاهز لتغيير طريقة إدارتك؟</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">انضم لمئات أصحاب المغاسل الذين يثقون في CarwashPro. ابدأ مجاناً اليوم.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <StartFreeLink>
                <Button size="lg" className="h-13 px-8 text-base font-bold rounded-2xl bg-white text-blue-600 hover:bg-white/90 shadow-xl">
                  ابدأ مجاناً الآن
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                </Button>
              </StartFreeLink>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-13 px-8 text-base font-bold rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur">
                  تحدث مع المبيعات
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-slate-100 px-6 py-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25">
                <span className="text-sm font-black text-white">H&L</span>
              </div>
              <span className="font-bold text-slate-900">CarwashPro</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">نظام إدارة المغاسل الأشمل في المغرب.</p>
          </div>
          {[
            { title: "المنتج", links: ["الميزات", "الأسعار", "التحديثات", "العرض التوضيحي"] },
            { title: "الشركة", links: ["من نحن", "تواصل معنا", "المدونة", "وظائف"] },
            { title: "قانوني", links: ["الشروط", "الخصوصية", "الكوكيز", "الأمان"] },
          ].map((c, i) => (
            <div key={i}>
              <h4 className="font-bold text-sm text-slate-900 mb-4">{c.title}</h4>
              <ul className="space-y-2.5">
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© 2026 CarwashPro — H&Lavage. جميع الحقوق محفوظة.</p>
          <p className="text-xs text-slate-500">صُنع بحب 💙 في المغرب</p>
        </div>
      </footer>
    </div>
  );
}
