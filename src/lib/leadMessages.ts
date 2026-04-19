// Invitation message templates for B2B leads (carwash shops worldwide)

export interface LeadLike {
  name: string;
  owner_name?: string | null;
  country?: string | null;
  city?: string | null;
}

export type Lang = "ar" | "fr" | "en";

const PLATFORM_URL = "https://hn-carwash.online";
const PLATFORM_NAME = "H&Lavage";

const ARABIC_COUNTRIES = ["maroc", "morocco", "المغرب", "algeria", "algérie", "الجزائر", "tunisia", "tunisie", "تونس", "egypt", "égypte", "مصر", "saudi", "السعودية", "uae", "الإمارات", "qatar", "قطر", "kuwait", "الكويت"];
const FRENCH_COUNTRIES = ["france", "belgique", "belgium", "suisse", "switzerland", "luxembourg", "canada", "sénégal", "senegal", "côte d'ivoire", "ivory coast"];

export function detectLang(country?: string | null): Lang {
  if (!country) return "en";
  const c = country.trim().toLowerCase();
  if (ARABIC_COUNTRIES.some((k) => c.includes(k))) return "ar";
  if (FRENCH_COUNTRIES.some((k) => c.includes(k))) return "fr";
  return "en";
}

// ---------------- WhatsApp ----------------
export function buildInviteWhatsAppMessage(lead: LeadLike, lang: Lang = detectLang(lead.country)): string {
  const greet = lead.owner_name || lead.name;

  if (lang === "ar") {
    return `السلام عليكم ${greet} 👋

نحن فريق *${PLATFORM_NAME}* — منصة ذكية متكاملة لإدارة محلات غسيل السيارات.

✨ ما نقدمه لمحل *${lead.name}*:
✅ إدارة الطلبات والعمال في الوقت الفعلي
✅ فواتير احترافية تلقائية
✅ تقارير مالية يومية وشهرية
✅ متابعة الزبائن وسياراتهم

🎁 *تجربة مجانية 15 يوم* بدون أي التزام.

سجّل الآن: ${PLATFORM_URL}

نتمنى أن تكون شريكاً لنا 🚗💧`;
  }

  if (lang === "fr") {
    return `Bonjour ${greet} 👋

Nous sommes l'équipe *${PLATFORM_NAME}* — la plateforme intelligente pour gérer votre station de lavage auto.

✨ Pour *${lead.name}* :
✅ Gestion des commandes et employés en temps réel
✅ Factures professionnelles automatiques
✅ Rapports financiers quotidiens et mensuels
✅ Suivi clients et véhicules

🎁 *Essai gratuit 15 jours* sans engagement.

Inscrivez-vous : ${PLATFORM_URL}

Au plaisir de vous compter parmi nos partenaires 🚗💧`;
  }

  return `Hello ${greet} 👋

We're the *${PLATFORM_NAME}* team — the smart all-in-one platform for car wash businesses.

✨ Built for *${lead.name}*:
✅ Real-time orders & staff management
✅ Automatic professional invoices
✅ Daily & monthly financial reports
✅ Customer & vehicle tracking

🎁 *15-day free trial* — no commitment.

Sign up: ${PLATFORM_URL}

Looking forward to having you on board 🚗💧`;
}

// ---------------- Email ----------------
export function buildInviteEmailSubject(lead: LeadLike, lang: Lang = detectLang(lead.country)): string {
  if (lang === "ar") return `${lead.name} — طوّر إدارة محلك مع ${PLATFORM_NAME} 🚗`;
  if (lang === "fr") return `${lead.name} — Modernisez votre station de lavage avec ${PLATFORM_NAME} 🚗`;
  return `${lead.name} — Modernize your car wash with ${PLATFORM_NAME} 🚗`;
}

export function buildInviteEmailBody(lead: LeadLike, lang: Lang = detectLang(lead.country)): string {
  const greet = lead.owner_name || lead.name;

  if (lang === "ar") {
    return `مرحباً ${greet}،

اسمحوا لنا أن نقدم لكم *${PLATFORM_NAME}* — أول منصة عربية متخصصة في إدارة محلات غسيل السيارات بشكل احترافي وذكي.

لماذا ${PLATFORM_NAME}؟
• 📋 إدارة كاملة للطلبات (انتظار / قيد التنفيذ / مكتمل)
• 🧾 فواتير تلقائية واحترافية
• 📊 تقارير مالية ومبيعات لحظية
• 👥 إدارة الموظفين والفروع المتعددة
• 📱 يعمل على الهاتف والكمبيوتر

🎁 جربها مجاناً لمدة 15 يوم — بدون بطاقة ائتمان.

سجّل الآن: ${PLATFORM_URL}

نحن متحمسون للعمل مع محل ${lead.name}!

تحياتنا،
فريق ${PLATFORM_NAME}
${PLATFORM_URL}`;
  }

  if (lang === "fr") {
    return `Bonjour ${greet},

Permettez-nous de vous présenter *${PLATFORM_NAME}* — la plateforme tout-en-un dédiée à la gestion intelligente des stations de lavage auto.

Pourquoi ${PLATFORM_NAME} ?
• 📋 Gestion complète des commandes (en attente / en cours / terminées)
• 🧾 Factures automatiques et professionnelles
• 📊 Rapports financiers en temps réel
• 👥 Gestion des employés et multi-succursales
• 📱 Mobile et desktop

🎁 Essai gratuit 15 jours — sans carte bancaire.

Inscrivez-vous : ${PLATFORM_URL}

Nous serions ravis de collaborer avec ${lead.name} !

Cordialement,
L'équipe ${PLATFORM_NAME}
${PLATFORM_URL}`;
  }

  return `Hello ${greet},

Allow us to introduce *${PLATFORM_NAME}* — the all-in-one smart platform purpose-built for car wash businesses.

Why ${PLATFORM_NAME}?
• 📋 Full order management (waiting / in progress / completed)
• 🧾 Automatic, professional invoices
• 📊 Real-time financial & sales reports
• 👥 Multi-branch & employee management
• 📱 Works on mobile and desktop

🎁 Try it free for 15 days — no credit card required.

Sign up: ${PLATFORM_URL}

We'd love to have ${lead.name} on board!

Best regards,
The ${PLATFORM_NAME} Team
${PLATFORM_URL}`;
}

export function whatsappLink(phone: string, message: string): string {
  const cleaned = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
