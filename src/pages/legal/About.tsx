import { useTranslation } from "react-i18next";
import { LegalLayout, pickLang } from "./LegalLayout";

export default function About() {
  const { i18n } = useTranslation();
  const c = pickLang(i18n.language, {
    ar: {
      title: "من نحن",
      desc: "H&Lavage — منصة مغربية متكاملة لإدارة مغاسل السيارات بكفاءة واحترافية.",
      body: (
        <>
          <p><strong>H&Lavage</strong> منصة SaaS مغربية مصممة خصيصاً لأصحاب مغاسل السيارات. هدفنا تبسيط الإدارة اليومية وتمكين أصحاب الأعمال من التركيز على ما يهم: العملاء والنمو.</p>
          <h2>مهمتنا</h2>
          <p>تحويل قطاع غسيل السيارات في المغرب من إدارة ورقية إلى منصة رقمية موحّدة، ذكية، وسهلة الاستخدام.</p>
          <h2>ما نقدمه</h2>
          <ul>
            <li>نظام طلبات وفواتير متكامل.</li>
            <li>إدارة موظفين وفروع متعددة.</li>
            <li>تقارير وتحليلات ذكية.</li>
            <li>اشتراكات B2B بنظام النقاط.</li>
            <li>دعم متعدد اللغات: عربية، فرنسية، إنجليزية.</li>
          </ul>
          <h2>قيمنا</h2>
          <p><strong>البساطة</strong> · <strong>الموثوقية</strong> · <strong>الشفافية</strong> · <strong>الدعم المحلي</strong></p>
        </>
      ),
    },
    en: {
      title: "About H&Lavage",
      desc: "H&Lavage — a Moroccan SaaS platform built for car wash owners.",
      body: (
        <>
          <p><strong>H&Lavage</strong> is a Moroccan SaaS platform built specifically for car wash owners. Our goal is to simplify daily operations so owners can focus on what matters: customers and growth.</p>
          <h2>Our mission</h2>
          <p>Move Morocco's car wash industry from paper-based ops to one unified, smart, easy-to-use digital platform.</p>
          <h2>What we offer</h2>
          <ul>
            <li>Integrated orders & invoicing.</li>
            <li>Employee & multi-branch management.</li>
            <li>Smart reports and analytics.</li>
            <li>B2B point-based subscriptions.</li>
            <li>Multilingual: Arabic, French, English.</li>
          </ul>
          <h2>Our values</h2>
          <p><strong>Simplicity</strong> · <strong>Reliability</strong> · <strong>Transparency</strong> · <strong>Local support</strong></p>
        </>
      ),
    },
    fr: {
      title: "À propos de H&Lavage",
      desc: "H&Lavage — plateforme SaaS marocaine pour les propriétaires de car wash.",
      body: (
        <>
          <p><strong>H&Lavage</strong> est une plateforme SaaS marocaine conçue pour les propriétaires de car wash. Notre but : simplifier la gestion quotidienne pour vous concentrer sur l'essentiel.</p>
          <h2>Notre mission</h2>
          <p>Faire passer le secteur du car wash au Maroc d'une gestion papier à une plateforme numérique unifiée, intelligente et simple.</p>
          <h2>Ce que nous offrons</h2>
          <ul>
            <li>Commandes et facturation intégrées.</li>
            <li>Gestion des employés et multi-succursales.</li>
            <li>Rapports et analyses intelligents.</li>
            <li>Abonnements B2B à points.</li>
            <li>Multilingue : arabe, français, anglais.</li>
          </ul>
          <h2>Nos valeurs</h2>
          <p><strong>Simplicité</strong> · <strong>Fiabilité</strong> · <strong>Transparence</strong> · <strong>Support local</strong></p>
        </>
      ),
    },
  });
  return <LegalLayout title={c.title} description={c.desc}>{c.body}</LegalLayout>;
}