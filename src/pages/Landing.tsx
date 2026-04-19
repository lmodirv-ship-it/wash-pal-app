import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import heroCarwash from "@/assets/hero-carwash.jpg";
import featureDetail from "@/assets/feature-detail.jpg";
import featureFacility from "@/assets/feature-facility.jpg";
import featureWash from "@/assets/feature-wash.jpg";
import carwashVideo from "@/assets/carwash-hero.mp4.asset.json";

/* ---------- Auth-aware Start Free wrapper ---------- */
function StartFreeLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const navigate = useNavigate();
  const target = "/signup?redirect=create-shop";
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
import { BrandLogo } from "@/components/BrandLogo";
import { useTranslation } from "react-i18next";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, BarChart3, Users, TrendingUp, Brain, Check, Star,
  ArrowRight, Zap, Shield, Smartphone, Building2, Play,
  PlusCircle, Receipt, Rocket, Eye
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
} as const;

export default function Landing() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [scrolled, setScrolled] = useState(false);
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const SESSION_KEY = "hl_visit_counted";
    const load = async () => {
      try {
        const alreadyCounted = sessionStorage.getItem(SESSION_KEY);
        if (!alreadyCounted) {
          const { data } = await supabase.rpc("increment_visitor");
          sessionStorage.setItem(SESSION_KEY, "1");
          if (mounted && typeof data === "number") setVisitors(data);
        } else {
          const { data } = await supabase.from("visitor_stats").select("total_visits").eq("id", 1).maybeSingle();
          if (mounted && data) setVisitors(Number(data.total_visits));
        }
      } catch { /* ignore */ }
    };
    load();
    const channel = supabase
      .channel("visitor_stats_live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "visitor_stats" }, (payload) => {
        const next = (payload.new as { total_visits?: number })?.total_visits;
        if (mounted && typeof next === "number") setVisitors(next);
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-[#05060a] text-white overflow-x-hidden" dir={isRtl ? "rtl" : "ltr"} style={{ scrollBehavior: "smooth" }}>
      {/* Glossy black ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_90%_30%,rgba(34,211,238,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_10%_70%,rgba(250,204,21,0.10),transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* ===== Sticky Nav ===== */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo size={36} />
            <span className="font-bold text-white tracking-tight">CarwashPro</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#pricing" className="hover:text-white transition-colors">الأسعار</a>
            <a href="#features" className="hover:text-white transition-colors">الميزات</a>
            <a href="#how" className="hover:text-white transition-colors">كيف يعمل</a>
            <a href="#testimonials" className="hover:text-white transition-colors">الآراء</a>
          </div>
          <div className="flex items-center gap-2">
            {visitors !== null && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <Eye className="w-3.5 h-3.5 text-white/70" />
                <span className="text-xs font-semibold text-white tabular-nums">{visitors.toLocaleString()}</span>
              </div>
            )}
            <div className="rounded-full bg-white/5 border border-white/10 backdrop-blur-md px-1 py-1 hover:border-white/20 transition-colors">
              <LanguageSwitcher />
            </div>
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl">تسجيل الدخول</Button>
            </Link>
            <StartFreeLink>
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-95 shadow-[0_0_25px_rgba(59,130,246,0.5)] rounded-xl border border-white/20">ابدأ مجاناً</Button>
            </StartFreeLink>
          </div>
        </div>
      </nav>

      {/* ===== Hero with REAL video ===== */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left text */}
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-white/80">جديد · نظام إدارة المغاسل 2026</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white mb-6">
              أدر مغسلتك
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">باحترافية كاملة 🚗</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-white/70 leading-relaxed mb-8 max-w-xl">
              تابع الإيرادات، أدر فريقك، ونمِّ أعمالك بسلاسة مع CarwashPro — منصة واحدة لكل ما تحتاجه.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3">
              <StartFreeLink>
                <Button size="lg" className="h-13 px-7 text-base font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-95 shadow-[0_10px_40px_-5px_rgba(59,130,246,0.6)] border border-white/20 group transition-all hover:-translate-y-0.5">
                  ابدأ مجاناً
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"} transition-transform`} />
                </Button>
              </StartFreeLink>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="h-13 px-7 text-base font-semibold rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md">
                  <Play className="w-4 h-4" />
                  شاهد الباقات
                </Button>
              </a>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-6 mt-8 text-xs text-white/60">
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 15 يوم تجربة مجانية</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> بدون بطاقة ائتمان</div>
              {visitors !== null && (
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-white/80 font-semibold tabular-nums">{visitors.toLocaleString()}</span> زائر
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right: REAL VIDEO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-[0_30px_80px_-20px_rgba(59,130,246,0.5)] aspect-video bg-black">
              <video
                src={(carwashVideo as { url: string }).url}
                poster={heroCarwash}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-[11px] font-bold text-white">LIVE · غسيل احترافي</span>
                </div>
              </div>
            </div>

            {/* Floating glassy stat cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="absolute -left-4 -top-4 hidden md:flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] text-white/60">نمو شهري</div>
                <div className="text-sm font-black text-white">+34.2%</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="absolute -right-4 -bottom-4 hidden md:flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-300 fill-blue-300" />
              </div>
              <div>
                <div className="text-[10px] text-white/60">رضا العملاء</div>
                <div className="text-sm font-black text-white">4.9 / 5</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== PRICING (moved up) ===== */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">💳 باقاتنا</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">اختر الباقة المناسبة لك</h2>
            <p className="text-white/60 max-w-2xl mx-auto">15 يوم تجربة مجانية لكل محل جديد · بدون بطاقة ائتمان · ألغِ متى شئت</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {[
              { name: "Starter", arName: "بداية", price: "99", credits: "300 عملية / شهر", icon: Zap, features: ["فرع واحد", "حتى 3 موظفين", "300 عملية شهرياً", "تقارير أساسية"], highlight: false },
              { name: "Pro", arName: "احترافي", price: "199", credits: "1000 عملية / شهر", icon: Sparkles, features: ["حتى 3 فروع", "حتى 10 موظفين", "1000 عملية شهرياً", "تقارير متقدمة", "Email + WhatsApp"], highlight: true },
              { name: "Business", arName: "متقدم", price: "399", credits: "5000 عملية / شهر", icon: Shield, features: ["فروع غير محدودة", "موظفون غير محدودون", "5000 عملية شهرياً", "تحليلات متقدمة جداً"], highlight: false },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className={`relative p-8 rounded-3xl transition-all duration-300 flex flex-col backdrop-blur-md ${
                  p.highlight
                    ? "bg-gradient-to-br from-blue-500/30 via-cyan-400/20 to-blue-500/30 border-2 border-cyan-300/50 shadow-[0_30px_80px_-20px_rgba(59,130,246,0.6)] scale-[1.03]"
                    : "bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 text-black text-[11px] font-black shadow-lg whitespace-nowrap">
                    ⭐ الأكثر اختياراً
                  </div>
                )}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <p.icon className={`w-7 h-7 ${p.highlight ? "text-white" : "text-cyan-300"}`} />
                    <div>
                      <div className="text-base font-black text-white">{p.name}</div>
                      <div className="text-[11px] text-white/60">{p.arName}</div>
                    </div>
                  </div>
                </div>
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tight text-white">{p.price}</span>
                    <span className="text-sm text-white/70">DH / شهر</span>
                  </div>
                </div>
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-5 text-xs font-medium ${p.highlight ? "bg-white/15 text-white" : "bg-cyan-300/10 text-cyan-300"}`}>
                  <Zap className="w-3.5 h-3.5" />
                  {p.credits}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${p.highlight ? "text-white" : "text-cyan-300"}`} />
                      <span className={p.highlight ? "text-white/95" : "text-white/75"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/pricing" className="block">
                  <Button className={`w-full h-12 font-bold rounded-xl ${
                    p.highlight
                      ? "bg-white text-blue-600 hover:bg-white/90 shadow-xl"
                      : "bg-white/10 border border-white/20 text-white hover:bg-white/15 backdrop-blur-md"
                  }`}>
                    اختر {p.name}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md h-12 px-6">
                عرض كل الباقات بالتفصيل (بما فيها Enterprise)
                <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Trust bar ===== */}
      <section className="py-10 px-6 border-y border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-6">يستخدمها أكثر من 500 مغسلة في المغرب</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70">
            {["AquaShine", "ProWash", "ClearCar", "EcoWash", "ShinyDrive", "FastClean"].map((n) => (
              <div key={n} className="text-lg font-black text-white/40 tracking-tight">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features (with REAL images) ===== */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
              <span className="text-xs font-semibold text-cyan-300">الميزات</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-white/60 max-w-2xl mx-auto">أدوات قوية ومتكاملة مصممة بدقة لمساعدتك على إدارة مغسلتك بكفاءة تامة</p>
          </motion.div>

          {/* Showcase grid with images */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { img: featureWash, title: "غسيل بالضغط العالي", desc: "تتبع كل عملية غسيل من بدايتها لنهايتها." },
              { img: featureDetail, title: "تلميع وعناية احترافية", desc: "سجّل خدمات الـ detailing وضاعف هوامشك." },
              { img: featureFacility, title: "إدارة عدة فروع", desc: "أدر كل فروعك ومحلاتك من لوحة واحدة." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -6 }}
                className="group relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-cyan-300/40 hover:shadow-[0_20px_60px_-20px_rgba(59,130,246,0.5)] transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-white/80">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "لوحة تحكم فورية", desc: "تابع أداء مغسلتك لحظة بلحظة مع بيانات حية ودقيقة." },
              { icon: Users, title: "تتبع الموظفين", desc: "قِس أداء كل موظف وحفّز فريقك لتحقيق أفضل النتائج." },
              { icon: TrendingUp, title: "تحليلات الإيرادات", desc: "تقارير مفصّلة وذكية لفهم نمو أعمالك واتجاهاتك." },
              { icon: Brain, title: "رؤى ذكية بالـ AI", desc: "توصيات مدعومة بالذكاء الاصطناعي لتحسين عملياتك." },
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
                className="group p-7 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-400/40 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-20px_rgba(59,130,246,0.4)] backdrop-blur-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Animated counters ===== */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-x-6 inset-y-6 rounded-3xl bg-gradient-to-br from-blue-600/20 via-cyan-500/15 to-blue-600/20 border border-white/10 backdrop-blur-md -z-10" />
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { to: visitors ?? 500, suffix: "+", label: "زائر إلى الآن" },
            { to: 1200000, label: "سيارة معالجة" },
            { to: 99, suffix: "%", label: "وقت التشغيل" },
            { to: 24, suffix: "/7", label: "دعم فني" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                <Counter to={s.to} suffix={s.suffix || ""} />
              </div>
              <div className="text-xs uppercase tracking-wider text-white/70 mt-2 font-semibold">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">ابدأ في 3 خطوات بسيطة</h2>
            <p className="text-white/60">من التسجيل إلى النمو — نحن معك في كل خطوة</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
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
                className="relative text-center p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-blue-400/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <s.icon className="w-7 h-7 text-cyan-300" />
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[10px] font-black shadow-lg">{s.n}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/60">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">يثقون بنا كل يوم</h2>
            <p className="text-white/60">قصص نجاح حقيقية من أصحاب المغاسل</p>
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
                className="p-7 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 backdrop-blur-md transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 leading-relaxed mb-6 text-[15px]">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-white/50">{t.role}</div>
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
          className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl border border-white/15 backdrop-blur-xl p-12 md:p-16 text-center text-white shadow-[0_30px_100px_-20px_rgba(59,130,246,0.5)]"
        >
          {/* Background image */}
          <img src={heroCarwash} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover -z-10 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-black/70 to-cyan-900/80 -z-10" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">جاهز لتغيير طريقة إدارتك؟</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">انضم لمئات أصحاب المغاسل الذين يثقون في CarwashPro. ابدأ مجاناً اليوم.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <StartFreeLink>
                <Button size="lg" className="h-13 px-8 text-base font-bold rounded-2xl bg-white text-blue-600 hover:bg-white/90 shadow-xl border border-white/30 hover:-translate-y-0.5 transition-all">
                  ابدأ مجاناً الآن
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                </Button>
              </StartFreeLink>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="h-13 px-8 text-base font-bold rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur">
                  شاهد الباقات
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/10 px-6 py-12 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <span className="text-sm font-black text-white">H&L</span>
              </div>
              <span className="font-bold text-white">CarwashPro</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">نظام إدارة المغاسل الأشمل في المغرب.</p>
            {visitors !== null && (
              <p className="text-xs text-white/50 mt-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span className="tabular-nums">{visitors.toLocaleString()}</span> زائر إجمالي
              </p>
            )}
          </div>
          {[
            { title: "المنتج", links: ["الميزات", "الأسعار", "التحديثات", "العرض التوضيحي"] },
            { title: "الشركة", links: ["من نحن", "تواصل معنا", "المدونة", "وظائف"] },
            { title: "قانوني", links: ["الشروط", "الخصوصية", "الكوكيز", "الأمان"] },
          ].map((c, i) => (
            <div key={i}>
              <h4 className="font-bold text-sm text-white mb-4">{c.title}</h4>
              <ul className="space-y-2.5">
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a href="#" className="text-sm text-white/60 hover:text-cyan-300 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/50">© 2026 CarwashPro — H&Lavage. جميع الحقوق محفوظة.</p>
          <p className="text-xs text-white/50">صُنع بحب 💙 في المغرب</p>
        </div>
      </footer>
    </div>
  );
}
