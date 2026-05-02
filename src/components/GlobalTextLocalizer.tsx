import { useEffect } from "react";
import i18n from "@/i18n/config";
import ar from "@/i18n/locales/ar";
import fr from "@/i18n/locales/fr";
import en from "@/i18n/locales/en";

type LocaleObject = Record<string, unknown>;
type Lang = "ar" | "fr" | "en";

const flattenPairs = (source: LocaleObject, target: LocaleObject, out: Record<string, string> = {}) => {
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (typeof sourceValue === "string" && typeof targetValue === "string") {
      out[sourceValue] = targetValue;
      return;
    }
    if (
      sourceValue &&
      targetValue &&
      typeof sourceValue === "object" &&
      typeof targetValue === "object" &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue)
    ) {
      flattenPairs(sourceValue as LocaleObject, targetValue as LocaleObject, out);
    }
  });
  return out;
};

const manual = {
  ar: {
    "Owner Dashboard": "لوحة المالك",
    "Gestion utilisateurs": "إدارة المستخدمين",
    "Journal d'audit": "سجل التدقيق",
    "Abonnements": "الاشتراكات",
    "Plans tarifaires": "خطط الأسعار",
    "Leads": "العملاء المحتملون",
    "Propriétaire plateforme": "مالك المنصة",
    "Admin / Propriétaire magasin": "مدير / صاحب محل",
    "Gérant / Manager": "مسير / مدير",
    "Panneau d'administration": "لوحة الإدارة",
    "Control Panel": "لوحة التحكم",
    "Administrateur": "مدير",
    "Owner Console": "لوحة المالك",
    "Platform Admin": "إدارة المنصة",
  },
  fr: {
    "بالبريد": "Par email",
    "اسم + كود": "Nom + code",
    "مرجع": "Référence",
    "ليس لديك حساب؟": "Vous n'avez pas de compte ?",
    "إنشاء حساب جديد": "Créer un compte",
    "موظف جديد؟": "Nouvel employé ?",
    "انضم باستخدام رقم تعريف المحل": "Rejoindre avec l'identifiant du lavage",
    "اسم الموظف": "Nom de l'employé",
    "مثال: ahmed": "Ex. : ahmed",
    "الكود (المرجع)": "Code (référence)",
    "رقم التعريف (Reference)": "Identifiant (référence)",
    "أدخل رقم التعريف الخاص بك وكلمة السر التي حددها المدير.": "Saisissez votre identifiant et le mot de passe défini par le responsable.",
    "غير مصرّح بالدخول": "Accès non autorisé",
    "ليس لديك الصلاحية للوصول إلى هذه الصفحة.": "Vous n'avez pas l'autorisation d'accéder à cette page.",
    "دورك الحالي:": "Votre rôle actuel :",
    "رجوع": "Retour",
    "صفحتي الرئيسية": "Ma page d'accueil",
    "تسجيل الخروج وتجربة حساب آخر": "Se déconnecter et essayer un autre compte",
    "📅 المواعيد": "📅 Rendez-vous",
    "المداخل": "Entrées",
    "فريق العمل": "Équipe",
    "طلبات الانضمام": "Demandes d'adhésion",
    "🎟️ كوبونات": "🎟️ Coupons",
    "📧 رسائل": "📧 Messages",
    "🔍 تنقيب": "🔍 Prospection",
    "صاحب المحل": "Propriétaire du lavage",
    "زبون": "Client",
    "نظرة عامة": "Vue d'ensemble",
    "لوحة التحكم": "Tableau de bord",
    "الطلبات المباشرة": "Commandes en direct",
    "إدارة المنصة": "Gestion de la plateforme",
    "المتاجر": "Laveurs",
    "الخدمات": "Services",
    "المستخدمون والأدوار": "Utilisateurs et rôles",
    "سجل الأدوار": "Journal des rôles",
    "الأمان والامتثال": "Sécurité et conformité",
    "الأمان": "Sécurité",
    "الجلسات النشطة": "Sessions actives",
    "نشاط النظام": "Activité système",
    "سجل التدقيق": "Journal d'audit",
    "تصدير البيانات": "Export des données",
    "الفوترة": "Facturation",
    "الاشتراكات": "Abonnements",
    "خطط الأسعار": "Plans tarifaires",
    "الفواتير": "Factures",
    "العملاء المحتملون": "Leads",
    "النظام": "Système",
    "قاعدة البيانات": "Base de données",
    "الإشعارات والإعلانات": "Notifications et annonces",
    "مفاتيح API": "Clés API",
    "الإعدادات العامة": "Paramètres généraux",
    "خروج": "Déconnexion",
  },
  en: {
    "بالبريد": "By email",
    "اسم + كود": "Name + code",
    "مرجع": "Reference",
    "ليس لديك حساب؟": "Don't have an account?",
    "إنشاء حساب جديد": "Create a new account",
    "موظف جديد؟": "New employee?",
    "انضم باستخدام رقم تعريف المحل": "Join with the shop identifier",
    "اسم الموظف": "Employee name",
    "مثال: ahmed": "Example: ahmed",
    "الكود (المرجع)": "Code (reference)",
    "رقم التعريف (Reference)": "Identifier (reference)",
    "أدخل رقم التعريف الخاص بك وكلمة السر التي حددها المدير.": "Enter your identifier and the password set by the manager.",
    "غير مصرّح بالدخول": "Unauthorized access",
    "ليس لديك الصلاحية للوصول إلى هذه الصفحة.": "You do not have permission to access this page.",
    "دورك الحالي:": "Your current role:",
    "رجوع": "Back",
    "صفحتي الرئيسية": "My home page",
    "تسجيل الخروج وتجربة حساب آخر": "Sign out and try another account",
    "📅 المواعيد": "📅 Appointments",
    "المداخل": "Entries",
    "فريق العمل": "Team",
    "طلبات الانضمام": "Join requests",
    "🎟️ كوبونات": "🎟️ Coupons",
    "📧 رسائل": "📧 Messages",
    "🔍 تنقيب": "🔍 Prospecting",
    "صاحب المحل": "Shop owner",
    "زبون": "Customer",
    "نظرة عامة": "Overview",
    "لوحة التحكم": "Dashboard",
    "الطلبات المباشرة": "Live orders",
    "إدارة المنصة": "Platform management",
    "المتاجر": "Shops",
    "الخدمات": "Services",
    "المستخدمون والأدوار": "Users and roles",
    "سجل الأدوار": "Role log",
    "الأمان والامتثال": "Security and compliance",
    "الأمان": "Security",
    "الجلسات النشطة": "Active sessions",
    "نشاط النظام": "System activity",
    "سجل التدقيق": "Audit log",
    "تصدير البيانات": "Data export",
    "الفوترة": "Billing",
    "الاشتراكات": "Subscriptions",
    "خطط الأسعار": "Pricing plans",
    "الفواتير": "Invoices",
    "العملاء المحتملون": "Leads",
    "النظام": "System",
    "قاعدة البيانات": "Database",
    "الإشعارات والإعلانات": "Notifications and announcements",
    "مفاتيح API": "API keys",
    "الإعدادات العامة": "General settings",
    "خروج": "Logout",
  },
} satisfies Record<Lang, Record<string, string>>;

const dictionaries = {
  ar: {
    ...flattenPairs(fr as LocaleObject, ar as LocaleObject),
    ...flattenPairs(en as LocaleObject, ar as LocaleObject),
    ...manual.ar,
  },
  fr: {
    ...flattenPairs(ar as LocaleObject, fr as LocaleObject),
    ...flattenPairs(en as LocaleObject, fr as LocaleObject),
    ...manual.fr,
  },
  en: {
    ...flattenPairs(ar as LocaleObject, en as LocaleObject),
    ...flattenPairs(fr as LocaleObject, en as LocaleObject),
    ...manual.en,
  },
};

const textOriginals = new WeakMap<Text, string>();
const containsArabic = /[\u0600-\u06FF]/;
const translatableAttrs = ["title", "aria-label", "placeholder"] as const;
const hasKnownTranslation = (value: string) => {
  const core = value.trim();
  return containsArabic.test(core) || Object.values(dictionaries).some((dict) => Boolean(dict[core]));
};

const currentLang = (): Lang => {
  const raw = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  return raw === "ar" || raw === "en" ? raw : "fr";
};

const translate = (value: string, lang: Lang) => {
  const dict = dictionaries[lang];
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  if (!hasKnownTranslation(core)) return value;
  if (dict[core]) return `${leading}${dict[core]}${trailing}`;
  if (!containsArabic.test(core)) return value;
  let translated = core;
  Object.entries(dict)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([from, to]) => {
      if (translated.includes(from)) translated = translated.split(from).join(to);
    });
  return translated === core ? value : `${leading}${translated}${trailing}`;
};

function scanNode(root: ParentNode, lang: Lang) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      const original = textOriginals.get(node as Text) ?? node.textContent ?? "";
      return hasKnownTranslation(original) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    const original = textOriginals.get(node) ?? node.textContent ?? "";
    if (!textOriginals.has(node)) textOriginals.set(node, original);
    const next = translate(original, lang);
    if (node.textContent !== next) node.textContent = next;
  });

  root.querySelectorAll?.("[title], [aria-label], input[placeholder], textarea[placeholder]").forEach((el) => {
    translatableAttrs.forEach((attr) => {
      const value = el.getAttribute(attr);
      if (!value) return;
      const dataAttr = `data-l10n-original-${attr}`;
      const original = el.getAttribute(dataAttr) || value;
      if (!el.hasAttribute(dataAttr) && hasKnownTranslation(original)) el.setAttribute(dataAttr, original);
      if (!hasKnownTranslation(original)) return;
      const next = translate(original, lang);
      if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
    });
  });
}

export function GlobalTextLocalizer() {
  useEffect(() => {
    let frame = 0;
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => scanNode(document.body, currentLang()));
    };

    run();
    i18n.on("languageChanged", run);
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });

    return () => {
      cancelAnimationFrame(frame);
      i18n.off("languageChanged", run);
      observer.disconnect();
    };
  }, []);

  return null;
}