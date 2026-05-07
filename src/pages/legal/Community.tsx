import { useTranslation } from "react-i18next";
import { LegalLayout, pickLang } from "./LegalLayout";

export default function Community() {
  const { i18n } = useTranslation();
  const c = pickLang(i18n.language, {
    ar: {
      title: "إرشادات المجتمع",
      desc: "القواعد التي تحافظ على مجتمع H&Lavage آمناً ومحترماً وذا قيمة للجميع.",
      body: (
        <>
          <p>نسعى لبناء مجتمع آمن ومحترم لجميع مستخدمي <strong>H&Lavage</strong>. هذه الإرشادات تنطبق على كل المحتوى والتفاعلات داخل المنصة.</p>
          <h2>1. الاحترام أولاً</h2>
          <p>عامل الآخرين كما تحب أن تُعامَل. لا مكان للتنمر أو التمييز أو الإساءة.</p>
          <h2>2. محتوى محظور</h2>
          <ul>
            <li>المحتوى العنيف أو الجنسي.</li>
            <li>الكلام المسيء أو خطاب الكراهية.</li>
            <li>المحتوى المضلِّل أو الاحتيالي.</li>
            <li>انتهاك حقوق الملكية الفكرية.</li>
            <li>البريد العشوائي والإعلانات غير المصرّح بها.</li>
          </ul>
          <h2>3. الخصوصية</h2>
          <p>لا تشارك معلومات شخصية للآخرين دون إذن. احترم بيانات عملائك وموظفيك.</p>
          <h2>4. الأمان</h2>
          <p>لا تحاول اختراق المنصة أو استغلال الثغرات. أبلغنا عن أي مشكلة أمنية عبر <a href="/legal/contact">صفحة التواصل</a>.</p>
          <h2>5. الإبلاغ والعقوبات</h2>
          <p>أبلغ عن أي مخالفة. قد نتخذ إجراءات تشمل التحذير، تعليق الحساب، أو الإنهاء النهائي.</p>
          <h2>6. التحديثات</h2>
          <p>قد نحدّث هذه الإرشادات لتطوير تجربة المجتمع.</p>
        </>
      ),
    },
    en: {
      title: "Community Guidelines",
      desc: "Rules that keep the H&Lavage community safe, respectful and valuable for everyone.",
      body: (
        <>
          <p>We strive to build a safe and respectful community for all <strong>H&Lavage</strong> users. These guidelines apply to all content and interactions on the platform.</p>
          <h2>1. Respect first</h2>
          <p>Treat others as you'd like to be treated. No bullying, discrimination or abuse.</p>
          <h2>2. Prohibited content</h2>
          <ul>
            <li>Violent or sexual content.</li>
            <li>Hate speech or abusive language.</li>
            <li>Misleading or fraudulent content.</li>
            <li>IP infringement.</li>
            <li>Spam and unauthorized ads.</li>
          </ul>
          <h2>3. Privacy</h2>
          <p>Do not share others' personal info without consent. Respect customer and staff data.</p>
          <h2>4. Security</h2>
          <p>Do not attempt to hack or exploit. Report security issues via <a href="/legal/contact">Contact</a>.</p>
          <h2>5. Reporting & enforcement</h2>
          <p>Report violations. We may warn, suspend, or permanently terminate accounts.</p>
          <h2>6. Updates</h2>
          <p>We may update these guidelines to improve the community experience.</p>
        </>
      ),
    },
    fr: {
      title: "Règles de la communauté",
      desc: "Règles pour garder la communauté H&Lavage sûre, respectueuse et utile à tous.",
      body: (
        <>
          <p>Nous bâtissons une communauté sûre et respectueuse pour tous les utilisateurs de <strong>H&Lavage</strong>.</p>
          <h2>1. Respect avant tout</h2>
          <p>Traitez les autres comme vous voulez être traité. Pas de harcèlement, discrimination ou abus.</p>
          <h2>2. Contenu interdit</h2>
          <ul>
            <li>Contenu violent ou sexuel.</li>
            <li>Discours haineux.</li>
            <li>Contenu trompeur ou frauduleux.</li>
            <li>Violation de propriété intellectuelle.</li>
            <li>Spam et publicités non autorisées.</li>
          </ul>
          <h2>3. Vie privée</h2>
          <p>Ne partagez pas les infos personnelles d'autrui sans consentement.</p>
          <h2>4. Sécurité</h2>
          <p>N'essayez pas de pirater. Signalez tout problème via <a href="/legal/contact">Contact</a>.</p>
          <h2>5. Signalement</h2>
          <p>Signalez les violations. Nous pouvons avertir, suspendre ou résilier.</p>
          <h2>6. Mises à jour</h2>
          <p>Ces règles peuvent évoluer.</p>
        </>
      ),
    },
  });
  return <LegalLayout title={c.title} description={c.desc} updated="2026-05-07">{c.body}</LegalLayout>;
}