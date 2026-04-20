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

// ---------------- Mailbutler / Gmail Compose ----------------
// Opens Gmail compose in a new tab with the lead's email, subject and body pre-filled.
// Mailbutler users have their Gmail integrated, so this opens directly in their workflow.
export function gmailComposeLink(email: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: subject,
    body: body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

// Mailbutler Web compose link — opens Mailbutler's web composer with prefilled fields
export function mailbutlerComposeLink(email: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    to: email,
    subject: subject,
    body: body,
  });
  return `https://web.mailbutler.io/compose?${params.toString()}`;
}

// Persuasive engagement message — emphasizes value, urgency, and free trial
export function buildEngagementEmailSubject(lead: LeadLike, lang: Lang = detectLang(lead.country)): string {
  if (lang === "ar") return `🚗 ${lead.name} — ضاعف أرباحك مع ${PLATFORM_NAME} (تجربة مجانية 15 يوم)`;
  if (lang === "fr") return `🚗 ${lead.name} — Doublez vos revenus avec ${PLATFORM_NAME} (Essai gratuit 15j)`;
  return `🚗 ${lead.name} — Double your revenue with ${PLATFORM_NAME} (15-day free trial)`;
}

export function buildEngagementEmailBody(lead: LeadLike, lang: Lang = detectLang(lead.country)): string {
  const greet = lead.owner_name || lead.name;

  if (lang === "ar") {
    return `مرحباً ${greet} 👋

هل تعلم أن أكثر من *60% من محلات غسيل السيارات* تخسر زبائنها بسبب سوء التنظيم وضياع الفواتير؟

نحن في *${PLATFORM_NAME}* صممنا منصة ذكية متكاملة خصيصاً لمحلات مثل *${lead.name}* — تساعدك على:

🚀 *مضاعفة أرباحك* عبر تنظيم الطلبات وتقليل الأخطاء
⚡ *توفير 3 ساعات يومياً* من العمل الإداري
💰 *تتبع كل درهم* — لا مزيد من الأموال الضائعة
📊 *تقارير لحظية* تكشف لك أين تربح وأين تخسر
👥 *إدارة كاملة للموظفين والفروع* من مكان واحد
📱 *يعمل على الهاتف* — تابع محلك حتى وأنت في البيت

✨ *ما الذي يميزنا؟*
✅ واجهة عربية 100% — لا حاجة لتعلم الإنجليزية
✅ دعم فني مباشر بالعربية
✅ بدون عقود طويلة — ألغِ متى شئت
✅ أسعار تبدأ من *99 درهم/شهر* فقط

🎁 *عرض حصري لمحل ${lead.name}:*
👉 *تجربة مجانية كاملة 15 يوم* — بدون بطاقة ائتمان
👉 *إعداد مجاني* لحسابك من فريقنا
👉 *تدريب مجاني* لك ولموظفيك

⏰ *العرض محدود* — انضم لأكثر من 200 محل يثقون بنا الآن.

🔗 سجل الآن: ${PLATFORM_URL}

أو رد على هذا الإيميل وسنتصل بك خلال 24 ساعة.

نحن متحمسون لرؤية ${lead.name} ينمو معنا 🚗💧

تحياتنا،
فريق ${PLATFORM_NAME}
${PLATFORM_URL}`;
  }

  if (lang === "fr") {
    return `Bonjour ${greet} 👋

Saviez-vous que *plus de 60% des stations de lavage* perdent des clients à cause d'une mauvaise organisation et de factures perdues ?

Chez *${PLATFORM_NAME}*, nous avons créé une plateforme intelligente conçue pour des stations comme *${lead.name}* — pour vous aider à :

🚀 *Doubler vos revenus* en organisant les commandes et réduisant les erreurs
⚡ *Économiser 3 heures par jour* de travail administratif
💰 *Suivre chaque euro* — fini l'argent perdu
📊 *Rapports en temps réel* pour savoir où vous gagnez et où vous perdez
👥 *Gestion complète des employés et succursales* depuis un seul endroit
📱 *Fonctionne sur mobile* — suivez votre station depuis chez vous

✨ *Ce qui nous distingue :*
✅ Interface 100% en français
✅ Support technique direct
✅ Sans engagement — annulez quand vous voulez
✅ Tarifs à partir de *9€/mois* seulement

🎁 *Offre exclusive pour ${lead.name} :*
👉 *Essai gratuit complet 15 jours* — sans carte bancaire
👉 *Configuration gratuite* de votre compte par notre équipe
👉 *Formation gratuite* pour vous et vos employés

⏰ *Offre limitée* — rejoignez plus de 200 stations qui nous font confiance.

🔗 Inscrivez-vous : ${PLATFORM_URL}

Ou répondez à cet email et nous vous appellerons sous 24h.

Nous sommes impatients de voir ${lead.name} grandir avec nous 🚗💧

Cordialement,
L'équipe ${PLATFORM_NAME}
${PLATFORM_URL}`;
  }

  return `Hello ${greet} 👋

Did you know that *over 60% of car wash businesses* lose customers due to poor organization and lost invoices?

At *${PLATFORM_NAME}*, we built a smart all-in-one platform designed for businesses like *${lead.name}* — to help you:

🚀 *Double your revenue* by organizing orders and reducing errors
⚡ *Save 3 hours daily* on administrative work
💰 *Track every dollar* — no more lost money
📊 *Real-time reports* showing where you earn and where you lose
👥 *Full employee & branch management* from one place
📱 *Works on mobile* — monitor your business from anywhere

✨ *What makes us different:*
✅ Built for car wash businesses — not generic
✅ Direct technical support
✅ No long contracts — cancel anytime
✅ Plans starting from *just $9/month*

🎁 *Exclusive offer for ${lead.name}:*
👉 *Full 15-day free trial* — no credit card required
👉 *Free account setup* by our team
👉 *Free training* for you and your staff

⏰ *Limited offer* — join 200+ businesses already trusting us.

🔗 Sign up now: ${PLATFORM_URL}

Or reply to this email and we'll call you within 24 hours.

We're excited to see ${lead.name} grow with us 🚗💧

Best regards,
The ${PLATFORM_NAME} Team
${PLATFORM_URL}`;
}
