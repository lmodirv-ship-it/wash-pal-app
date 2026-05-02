import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import heroCarwash from "@/assets/hero-carwash.jpg";
import featureDetail from "@/assets/feature-detail.jpg";
import featureFacility from "@/assets/feature-facility.jpg";
import featureWash from "@/assets/feature-wash.jpg";
import carwashVideo from "@/assets/carwash-hero.mp4.asset.json";
import promoVideo from "@/assets/hlavage-promo.mp4";

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
import { SEO } from "@/components/SEO";
import { SocialShare } from "@/components/SocialShare";
import { NewsletterSignup } from "@/components/NewsletterSignup";
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

  // SEO per language
  const seoTitle = isRtl
    ? "CarwashPro — نظام إدارة المغاسل الأشمل في المغرب"
    : i18n.language === "fr"
      ? "CarwashPro — Le système de gestion de car wash le plus complet"
      : "CarwashPro — The most complete car wash management system";
  const seoDesc = isRtl
    ? "أدر مغسلتك باحترافية: طلبات، فواتير، موظفين، تقارير و B2B. ابدأ مجاناً 15 يوماً بدون بطاقة."
    : i18n.language === "fr"
      ? "Gérez votre car wash facilement: commandes, factures, équipe, rapports, B2B. Essai gratuit 15 jours sans carte."
      : "Manage your car wash easily: orders, invoices, team, reports, B2B. Free 15-day trial, no card.";

  // ---- Inline i18n dictionary (FR default) ----
  const dict = {
    fr: {
      nav: { pricing: "Tarifs", features: "Fonctionnalités", how: "Comment ça marche", testimonials: "Avis", login: "Connexion", employee: "Espace employé", startFree: "Commencer gratuitement" },
      hero: { badge: "Nouveau · Système de gestion 2026", title1: "Gérez votre car wash", title2: "en toute simplicité 🚗", subtitle: "Suivez vos revenus, gérez votre équipe et développez votre activité avec CarwashPro — la plateforme tout-en-un.", cta1: "Commencer gratuitement", cta2: "Voir les tarifs", trial: "15 jours d'essai gratuit", noCard: "Sans carte de crédit", visitors: "visiteurs", live: "LIVE · Lavage Pro", growth: "Croissance mensuelle", rating: "Satisfaction client" },
      pricing: { badge: "💳 Nos forfaits", title: "Choisissez le forfait qui vous convient", subtitle: "15 jours d'essai gratuit pour chaque nouveau garage · Sans carte · Annulez quand vous voulez", popular: "⭐ Le plus choisi", perMonth: "DH / mois", choose: "Choisir", viewAll: "Voir tous les forfaits (Enterprise inclus)" },
      plans: [
        { name: "Starter", local: "Démarrage", credits: "300 opérations / mois", features: ["1 succursale", "Jusqu'à 3 employés", "300 opérations / mois", "Rapports de base"] },
        { name: "Pro", local: "Professionnel", credits: "1000 opérations / mois", features: ["Jusqu'à 3 succursales", "Jusqu'à 10 employés", "1000 opérations / mois", "Rapports avancés", "Email + WhatsApp"] },
        { name: "Business", local: "Entreprise", credits: "5000 opérations / mois", features: ["Succursales illimitées", "Employés illimités", "5000 opérations / mois", "Analyses très avancées"] },
      ],
      trust: "Utilisé par plus de 500 car wash au Maroc",
      features: { eyebrow: "Fonctionnalités", title: "Tout ce dont vous avez besoin en un seul endroit", subtitle: "Des outils puissants et intégrés conçus avec précision pour gérer votre car wash efficacement",
        showcase: [
          { title: "Lavage haute pression", desc: "Suivez chaque lavage de A à Z." },
          { title: "Polish et detailing pro", desc: "Enregistrez vos services premium et augmentez vos marges." },
          { title: "Multi-succursales", desc: "Gérez toutes vos succursales depuis un seul tableau de bord." },
        ],
        cards: [
          { title: "Tableau de bord en direct", desc: "Suivez la performance de votre garage minute par minute." },
          { title: "Suivi des employés", desc: "Mesurez la performance de chacun et motivez votre équipe." },
          { title: "Analyses de revenus", desc: "Rapports détaillés et intelligents pour comprendre votre croissance." },
          { title: "Insights par IA", desc: "Recommandations alimentées par l'intelligence artificielle." },
          { title: "Prêt multi-succursales", desc: "Gérez plusieurs succursales facilement depuis un seul écran." },
          { title: "Compatible mobile", desc: "Expérience fluide sur mobile et desktop — partout." },
        ],
      },
      stats: [{ label: "Visiteurs à ce jour" }, { label: "Voitures traitées" }, { label: "Disponibilité" }, { label: "Support" }],
      how: { title: "Démarrez en 3 étapes simples", subtitle: "De l'inscription à la croissance — nous sommes avec vous à chaque étape",
        steps: [
          { title: "Ajoutez vos services", desc: "Créez votre liste de services et tarifs en quelques minutes." },
          { title: "Suivez les opérations", desc: "Enregistrez les commandes et suivez leur statut en temps réel." },
          { title: "Développez votre activité", desc: "Analysez les performances et prenez des décisions éclairées." },
        ] },
      testimonials: { title: "Ils nous font confiance chaque jour", subtitle: "De vraies histoires de succès de propriétaires de car wash",
        items: [
          { name: "Ahmed Benali", role: "Propriétaire, Casablanca", text: "CarwashPro a transformé ma gestion. Je vois tout au même endroit, parfaitement organisé." },
          { name: "Souad El Mrabet", role: "Directrice de chaîne, Rabat", text: "Les rapports intelligents nous ont permis d'augmenter nos revenus de 35% en seulement 3 mois." },
          { name: "Karim El Fassi", role: "Propriétaire de 2 garages, Tanger", text: "Le support est excellent et l'application très fluide. Je le recommande vivement." },
        ] },
      cta: { title: "Prêt à transformer votre gestion ?", subtitle: "Rejoignez des centaines de propriétaires qui font confiance à CarwashPro. Commencez gratuitement aujourd'hui.", cta1: "Commencer maintenant", cta2: "Voir les tarifs" },
      footer: { tagline: "Le système de gestion de car wash le plus complet au Maroc.", visitorsTotal: "visiteurs au total",
        product: { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Mises à jour", "Démo"] },
        company: { title: "Entreprise", links: ["À propos", "Contact", "Blog", "Carrières"] },
        legal: { title: "Légal", links: ["Conditions", "Confidentialité", "Cookies", "Sécurité"] },
        rights: "© 2026 CarwashPro — H&Lavage. Tous droits réservés.", madeIn: "Fait avec 💙 au Maroc" },
    },
    ar: {
      nav: { pricing: "الأسعار", features: "الميزات", how: "كيف يعمل", testimonials: "الآراء", login: "تسجيل الدخول", employee: "دخول الموظف", startFree: "ابدأ مجاناً" },
      hero: { badge: "جديد · نظام إدارة المغاسل 2026", title1: "أدر مغسلتك", title2: "باحترافية كاملة 🚗", subtitle: "تابع الإيرادات، أدر فريقك، ونمِّ أعمالك بسلاسة مع CarwashPro — منصة واحدة لكل ما تحتاجه.", cta1: "ابدأ مجاناً", cta2: "شاهد الباقات", trial: "15 يوم تجربة مجانية", noCard: "بدون بطاقة ائتمان", visitors: "زائر", live: "LIVE · غسيل احترافي", growth: "نمو شهري", rating: "رضا العملاء" },
      pricing: { badge: "💳 باقاتنا", title: "اختر الباقة المناسبة لك", subtitle: "15 يوم تجربة مجانية لكل محل جديد · بدون بطاقة ائتمان · ألغِ متى شئت", popular: "⭐ الأكثر اختياراً", perMonth: "DH / شهر", choose: "اختر", viewAll: "عرض كل الباقات بالتفصيل (بما فيها Enterprise)" },
      plans: [
        { name: "Starter", local: "بداية", credits: "300 عملية / شهر", features: ["فرع واحد", "حتى 3 موظفين", "300 عملية شهرياً", "تقارير أساسية"] },
        { name: "Pro", local: "احترافي", credits: "1000 عملية / شهر", features: ["حتى 3 فروع", "حتى 10 موظفين", "1000 عملية شهرياً", "تقارير متقدمة", "Email + WhatsApp"] },
        { name: "Business", local: "متقدم", credits: "5000 عملية / شهر", features: ["فروع غير محدودة", "موظفون غير محدودون", "5000 عملية شهرياً", "تحليلات متقدمة جداً"] },
      ],
      trust: "يستخدمها أكثر من 500 مغسلة في المغرب",
      features: { eyebrow: "الميزات", title: "كل ما تحتاجه في مكان واحد", subtitle: "أدوات قوية ومتكاملة مصممة بدقة لمساعدتك على إدارة مغسلتك بكفاءة تامة",
        showcase: [
          { title: "غسيل بالضغط العالي", desc: "تتبع كل عملية غسيل من بدايتها لنهايتها." },
          { title: "تلميع وعناية احترافية", desc: "سجّل خدمات الـ detailing وضاعف هوامشك." },
          { title: "إدارة عدة فروع", desc: "أدر كل فروعك ومحلاتك من لوحة واحدة." },
        ],
        cards: [
          { title: "لوحة تحكم فورية", desc: "تابع أداء مغسلتك لحظة بلحظة مع بيانات حية ودقيقة." },
          { title: "تتبع الموظفين", desc: "قِس أداء كل موظف وحفّز فريقك لتحقيق أفضل النتائج." },
          { title: "تحليلات الإيرادات", desc: "تقارير مفصّلة وذكية لفهم نمو أعمالك واتجاهاتك." },
          { title: "رؤى ذكية بالـ AI", desc: "توصيات مدعومة بالذكاء الاصطناعي لتحسين عملياتك." },
          { title: "جاهز لعدة فروع", desc: "أدر فروعك المتعددة من لوحة واحدة وبكل سهولة." },
          { title: "متوافق مع الجوال", desc: "تجربة سلسة على الهاتف والحاسوب — أينما كنت." },
        ],
      },
      stats: [{ label: "زائر إلى الآن" }, { label: "سيارة معالجة" }, { label: "وقت التشغيل" }, { label: "دعم فني" }],
      how: { title: "ابدأ في 3 خطوات بسيطة", subtitle: "من التسجيل إلى النمو — نحن معك في كل خطوة",
        steps: [
          { title: "أضف خدماتك", desc: "أنشئ قائمة الخدمات والأسعار في دقائق." },
          { title: "تابع المعاملات", desc: "سجّل الطلبات وتابع حالتها لحظة بلحظة." },
          { title: "نمِّ أعمالك", desc: "حلّل الأداء واتخذ قرارات أذكى." },
        ] },
      testimonials: { title: "يثقون بنا كل يوم", subtitle: "قصص نجاح حقيقية من أصحاب المغاسل",
        items: [
          { name: "أحمد بنعلي", role: "صاحب مغسلة، الدار البيضاء", text: "غيّر CarwashPro طريقة إدارتي تماماً. أصبحت أرى كل شيء في مكان واحد ومنظم." },
          { name: "سعاد المرابط", role: "مديرة سلسلة مغاسل، الرباط", text: "التقارير الذكية ساعدتنا على زيادة الإيرادات بنسبة 35% خلال 3 أشهر فقط." },
          { name: "كريم الفاسي", role: "صاحب مغسلتين، طنجة", text: "الدعم الفني ممتاز والتطبيق سلس جداً. أنصح به بقوة لكل صاحب مغسلة." },
        ] },
      cta: { title: "جاهز لتغيير طريقة إدارتك؟", subtitle: "انضم لمئات أصحاب المغاسل الذين يثقون في CarwashPro. ابدأ مجاناً اليوم.", cta1: "ابدأ مجاناً الآن", cta2: "شاهد الباقات" },
      footer: { tagline: "نظام إدارة المغاسل الأشمل في المغرب.", visitorsTotal: "زائر إجمالي",
        product: { title: "المنتج", links: ["الميزات", "الأسعار", "التحديثات", "العرض التوضيحي"] },
        company: { title: "الشركة", links: ["من نحن", "تواصل معنا", "المدونة", "وظائف"] },
        legal: { title: "قانوني", links: ["الشروط", "الخصوصية", "الكوكيز", "الأمان"] },
        rights: "© 2026 CarwashPro — H&Lavage. جميع الحقوق محفوظة.", madeIn: "صُنع بحب 💙 في المغرب" },
    },
    en: {
      nav: { pricing: "Pricing", features: "Features", how: "How it works", testimonials: "Reviews", login: "Sign in", employee: "Employee login", startFree: "Start free" },
      hero: { badge: "New · Car wash management 2026", title1: "Manage your car wash", title2: "with full pro power 🚗", subtitle: "Track revenue, manage your team, and grow your business smoothly with CarwashPro — one platform for everything.", cta1: "Start free", cta2: "See plans", trial: "15-day free trial", noCard: "No credit card", visitors: "visitors", live: "LIVE · Pro wash", growth: "Monthly growth", rating: "Customer rating" },
      pricing: { badge: "💳 Our plans", title: "Choose the plan that fits you", subtitle: "15-day free trial for every new shop · No credit card · Cancel anytime", popular: "⭐ Most popular", perMonth: "DH / month", choose: "Choose", viewAll: "View all plans in detail (Enterprise included)" },
      plans: [
        { name: "Starter", local: "Starter", credits: "300 operations / month", features: ["1 branch", "Up to 3 employees", "300 ops / month", "Basic reports"] },
        { name: "Pro", local: "Pro", credits: "1000 operations / month", features: ["Up to 3 branches", "Up to 10 employees", "1000 ops / month", "Advanced reports", "Email + WhatsApp"] },
        { name: "Business", local: "Business", credits: "5000 operations / month", features: ["Unlimited branches", "Unlimited employees", "5000 ops / month", "Very advanced analytics"] },
      ],
      trust: "Used by 500+ car washes in Morocco",
      features: { eyebrow: "Features", title: "Everything you need in one place", subtitle: "Powerful, integrated tools designed precisely to help you run your car wash efficiently",
        showcase: [
          { title: "High-pressure wash", desc: "Track every wash from start to finish." },
          { title: "Pro polish & detailing", desc: "Log detailing services and double your margins." },
          { title: "Multi-branch management", desc: "Run all your branches from one dashboard." },
        ],
        cards: [
          { title: "Live dashboard", desc: "Track your shop performance moment by moment with live data." },
          { title: "Employee tracking", desc: "Measure each employee's performance and motivate your team." },
          { title: "Revenue analytics", desc: "Detailed, smart reports to understand your growth and trends." },
          { title: "AI-powered insights", desc: "AI-driven recommendations to improve your operations." },
          { title: "Multi-branch ready", desc: "Run multiple branches from one dashboard easily." },
          { title: "Mobile-friendly", desc: "Smooth experience on mobile and desktop — anywhere." },
        ],
      },
      stats: [{ label: "Visitors so far" }, { label: "Cars processed" }, { label: "Uptime" }, { label: "Support" }],
      how: { title: "Start in 3 simple steps", subtitle: "From signup to growth — we're with you every step",
        steps: [
          { title: "Add your services", desc: "Create your service and pricing list in minutes." },
          { title: "Track operations", desc: "Log orders and track their status moment by moment." },
          { title: "Grow your business", desc: "Analyze performance and make smarter decisions." },
        ] },
      testimonials: { title: "Trusted every day", subtitle: "Real success stories from car wash owners",
        items: [
          { name: "Ahmed Benali", role: "Owner, Casablanca", text: "CarwashPro completely changed how I run my shop. I see everything in one organized place." },
          { name: "Souad El Mrabet", role: "Chain manager, Rabat", text: "Smart reports helped us increase revenue by 35% in just 3 months." },
          { name: "Karim El Fassi", role: "Owner of 2 shops, Tangier", text: "Support is excellent and the app is very smooth. I highly recommend it." },
        ] },
      cta: { title: "Ready to change how you run things?", subtitle: "Join hundreds of car wash owners who trust CarwashPro. Start free today.", cta1: "Start free now", cta2: "See plans" },
      footer: { tagline: "The most complete car wash management system in Morocco.", visitorsTotal: "total visitors",
        product: { title: "Product", links: ["Features", "Pricing", "Updates", "Demo"] },
        company: { title: "Company", links: ["About", "Contact", "Blog", "Careers"] },
        legal: { title: "Legal", links: ["Terms", "Privacy", "Cookies", "Security"] },
        rights: "© 2026 CarwashPro — H&Lavage. All rights reserved.", madeIn: "Made with 💙 in Morocco" },
    },
  } as const;
  const lang = (i18n.language === "ar" ? "ar" : i18n.language === "en" ? "en" : "fr") as "fr" | "ar" | "en";
  const T = dict[lang];

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
      <SEO title={seoTitle} description={seoDesc} canonical={typeof window !== "undefined" ? window.location.origin + "/" : undefined} />
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
            <a href="#pricing" className="hover:text-white transition-colors">{T.nav.pricing}</a>
            <a href="#features" className="hover:text-white transition-colors">{T.nav.features}</a>
            <a href="#how" className="hover:text-white transition-colors">{T.nav.how}</a>
            <a href="#testimonials" className="hover:text-white transition-colors">{T.nav.testimonials}</a>
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
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl">{T.nav.login}</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" variant="outline" className="rounded-xl border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200 backdrop-blur-md">
                {T.nav.employee}
              </Button>
            </Link>
            <StartFreeLink>
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-95 shadow-[0_0_25px_rgba(59,130,246,0.5)] rounded-xl border border-white/20">{T.nav.startFree}</Button>
            </StartFreeLink>
          </div>
        </div>
      </nav>

      {/* ===== Promo video banner (side-aligned by language) ===== */}
      <section className="relative pt-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex">
          <motion.div
            initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full sm:w-1/2 lg:w-2/5 rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_80px_-20px_rgba(59,130,246,0.4)] bg-black ${isRtl ? "sm:ml-auto" : "sm:mr-auto"}`}
          >
            <video
              src={promoVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-auto block aspect-video object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* ===== Hero with REAL video ===== */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left text */}
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-white/80">{T.hero.badge}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white mb-6">
              {T.hero.title1}
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">{T.hero.title2}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-white/70 leading-relaxed mb-8 max-w-xl">
              {T.hero.subtitle}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3">
              <StartFreeLink>
                <Button size="lg" className="h-13 px-7 text-base font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-95 shadow-[0_10px_40px_-5px_rgba(59,130,246,0.6)] border border-white/20 group transition-all hover:-translate-y-0.5">
                  {T.hero.cta1}
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"} transition-transform`} />
                </Button>
              </StartFreeLink>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="h-13 px-7 text-base font-semibold rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md">
                  <Play className="w-4 h-4" />
                  {T.hero.cta2}
                </Button>
              </a>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-6 mt-8 text-xs text-white/60">
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> {T.hero.trial}</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> {T.hero.noCard}</div>
              {visitors !== null && (
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-white/80 font-semibold tabular-nums">{visitors.toLocaleString()}</span> {T.hero.visitors}
                </div>
              )}
            </motion.div>
            <motion.div variants={fadeUp} custom={5} className="mt-6">
              <SocialShare />
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
                  <span className="text-[11px] font-bold text-white">{T.hero.live}</span>
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
                <div className="text-[10px] text-white/60">{T.hero.growth}</div>
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
                <div className="text-[10px] text-white/60">{T.hero.rating}</div>
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
              <span className="text-xs font-bold text-primary">{T.pricing.badge}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">{T.pricing.title}</h2>
            <p className="text-white/60 max-w-2xl mx-auto">{T.pricing.subtitle}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {[
              { ...T.plans[0], price: "99", icon: Zap, highlight: false },
              { ...T.plans[1], price: "199", icon: Sparkles, highlight: true },
              { ...T.plans[2], price: "399", icon: Shield, highlight: false },
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
                    {T.pricing.popular}
                  </div>
                )}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <p.icon className={`w-7 h-7 ${p.highlight ? "text-white" : "text-cyan-300"}`} />
                    <div>
                      <div className="text-base font-black text-white">{p.name}</div>
                      <div className="text-[11px] text-white/60">{p.local}</div>
                    </div>
                  </div>
                </div>
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tight text-white">{p.price}</span>
                    <span className="text-sm text-white/70">{T.pricing.perMonth}</span>
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
                    {T.pricing.choose} {p.name}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md h-12 px-6">
                {T.pricing.viewAll}
                <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Trust bar ===== */}
      <section className="py-10 px-6 border-y border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-6">{T.trust}</p>
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
              <span className="text-xs font-semibold text-cyan-300">{T.features.eyebrow}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">{T.features.title}</h2>
            <p className="text-white/60 max-w-2xl mx-auto">{T.features.subtitle}</p>
          </motion.div>

          {/* Showcase grid with images */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { img: featureWash, ...T.features.showcase[0] },
              { img: featureDetail, ...T.features.showcase[1] },
              { img: featureFacility, ...T.features.showcase[2] },
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
              { icon: BarChart3, ...T.features.cards[0] },
              { icon: Users, ...T.features.cards[1] },
              { icon: TrendingUp, ...T.features.cards[2] },
              { icon: Brain, ...T.features.cards[3] },
              { icon: Building2, ...T.features.cards[4] },
              { icon: Smartphone, ...T.features.cards[5] },
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
            { to: visitors ?? 500, suffix: "+", label: T.stats[0].label },
            { to: 1200000, label: T.stats[1].label },
            { to: 99, suffix: "%", label: T.stats[2].label },
            { to: 24, suffix: "/7", label: T.stats[3].label },
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
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">{T.how.title}</h2>
            <p className="text-white/60">{T.how.subtitle}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
            {[
              { icon: PlusCircle, n: "01", ...T.how.steps[0] },
              { icon: Receipt, n: "02", ...T.how.steps[1] },
              { icon: Rocket, n: "03", ...T.how.steps[2] },
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
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">{T.testimonials.title}</h2>
            <p className="text-white/60">{T.testimonials.subtitle}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {T.testimonials.items.map((t, i) => (
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
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{T.cta.title}</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">{T.cta.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <StartFreeLink>
                <Button size="lg" className="h-13 px-8 text-base font-bold rounded-2xl bg-white text-blue-600 hover:bg-white/90 shadow-xl border border-white/30 hover:-translate-y-0.5 transition-all">
                  {T.cta.cta1}
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                </Button>
              </StartFreeLink>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="h-13 px-8 text-base font-bold rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur">
                  {T.cta.cta2}
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
            <p className="text-sm text-white/60 leading-relaxed">{T.footer.tagline}</p>
            {visitors !== null && (
              <p className="text-xs text-white/50 mt-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span className="tabular-nums">{visitors.toLocaleString()}</span> {T.footer.visitorsTotal}
              </p>
            )}
          </div>
          {[
            T.footer.product,
            T.footer.company,
            T.footer.legal,
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
          <p className="text-xs text-white/50">{T.footer.rights}</p>
          <p className="text-xs text-white/50">{T.footer.madeIn}</p>
        </div>
      </footer>
    </div>
  );
}
