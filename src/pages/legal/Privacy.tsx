import { useTranslation } from "react-i18next";
import { LegalLayout, pickLang } from "./LegalLayout";

export default function Privacy() {
  const { i18n } = useTranslation();
  const c = pickLang(i18n.language, {
    ar: {
      title: "سياسة الخصوصية",
      desc: "كيف تجمع منصة H&Lavage بياناتك وتستخدمها وتحميها بما يتوافق مع GDPR و Google AdSense.",
      body: (
        <>
          <p>نحن في <strong>H&Lavage</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيف نجمع المعلومات ونستخدمها ونحميها عند استخدامك لخدماتنا.</p>
          <h2>1. البيانات التي نجمعها</h2>
          <ul>
            <li><strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف.</li>
            <li><strong>بيانات الاستخدام:</strong> سجلات الطلبات، الفواتير، نشاط لوحة التحكم.</li>
            <li><strong>بيانات تقنية:</strong> عنوان IP، نوع المتصفح، نظام التشغيل، الكوكيز.</li>
          </ul>
          <h2>2. كيف نستخدم البيانات</h2>
          <p>نستخدم بياناتك لتقديم الخدمة وتحسينها، ومعالجة المدفوعات، والتواصل معك، والامتثال للالتزامات القانونية.</p>
          <h2>3. الإعلانات والكوكيز (Google AdSense)</h2>
          <p>قد نعرض إعلانات من خلال <strong>Google AdSense</strong>. تستخدم Google كوكيز (بما فيها كوكي DART) لعرض إعلانات بناءً على زياراتك السابقة. يمكنك تعطيل ذلك من <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">إعدادات إعلانات Google</a>.</p>
          <p>نستخدم أيضاً كوكيز ضرورية لتشغيل المنصة (الجلسات، التفضيلات اللغوية).</p>
          <h2>4. مشاركة البيانات</h2>
          <p>لا نبيع بياناتك. قد نشاركها مع مزودي خدمات موثوقين (الاستضافة، المدفوعات، التحليلات) بموجب اتفاقيات سرية.</p>
          <h2>5. حقوقك (GDPR)</h2>
          <ul>
            <li>الحق في الوصول إلى بياناتك.</li>
            <li>الحق في التصحيح أو الحذف.</li>
            <li>الحق في الاعتراض على المعالجة.</li>
            <li>الحق في نقل البيانات.</li>
          </ul>
          <p>للتواصل: <a href="/legal/contact">صفحة التواصل</a>.</p>
          <h2>6. أمان البيانات</h2>
          <p>نستخدم التشفير (HTTPS)، Row-Level Security، والمصادقة الآمنة لحماية بياناتك.</p>
          <h2>7. الاحتفاظ بالبيانات</h2>
          <p>نحتفظ بالبيانات طوال فترة استخدامك للخدمة وللمدة التي يفرضها القانون.</p>
          <h2>8. تعديلات على هذه السياسة</h2>
          <p>قد نحدّث هذه السياسة من وقت لآخر. ستظهر التعديلات في هذه الصفحة مع تحديث التاريخ أعلاه.</p>
        </>
      ),
    },
    en: {
      title: "Privacy Policy",
      desc: "How H&Lavage collects, uses and protects your data — GDPR & Google AdSense compliant.",
      body: (
        <>
          <p>At <strong>H&Lavage</strong> we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use and safeguard information when you use our services.</p>
          <h2>1. Data we collect</h2>
          <ul>
            <li><strong>Account data:</strong> name, email, phone number.</li>
            <li><strong>Usage data:</strong> orders, invoices, dashboard activity.</li>
            <li><strong>Technical data:</strong> IP address, browser, OS, cookies.</li>
          </ul>
          <h2>2. How we use data</h2>
          <p>To deliver and improve the service, process payments, communicate with you, and comply with legal obligations.</p>
          <h2>3. Ads & cookies (Google AdSense)</h2>
          <p>We may display ads via <strong>Google AdSense</strong>. Google uses cookies (including the DART cookie) to serve ads based on your prior visits. You can opt out via <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>.</p>
          <p>We also use essential cookies (sessions, language preferences).</p>
          <h2>4. Data sharing</h2>
          <p>We do not sell your data. We may share it with trusted providers (hosting, payments, analytics) under confidentiality agreements.</p>
          <h2>5. Your rights (GDPR)</h2>
          <ul>
            <li>Right to access your data.</li>
            <li>Right to rectification or erasure.</li>
            <li>Right to object to processing.</li>
            <li>Right to data portability.</li>
          </ul>
          <p>Contact us via the <a href="/legal/contact">Contact page</a>.</p>
          <h2>6. Data security</h2>
          <p>We use HTTPS encryption, Row-Level Security, and secure authentication.</p>
          <h2>7. Data retention</h2>
          <p>We retain data while you use the service and as required by law.</p>
          <h2>8. Changes</h2>
          <p>We may update this policy. Changes appear on this page with the updated date above.</p>
        </>
      ),
    },
    fr: {
      title: "Politique de confidentialité",
      desc: "Comment H&Lavage collecte, utilise et protège vos données — conforme RGPD et Google AdSense.",
      body: (
        <>
          <p>Chez <strong>H&Lavage</strong>, nous respectons votre vie privée et nous engageons à protéger vos données personnelles.</p>
          <h2>1. Données collectées</h2>
          <ul>
            <li><strong>Compte :</strong> nom, email, téléphone.</li>
            <li><strong>Usage :</strong> commandes, factures, activité.</li>
            <li><strong>Technique :</strong> IP, navigateur, OS, cookies.</li>
          </ul>
          <h2>2. Utilisation</h2>
          <p>Fournir et améliorer le service, traiter les paiements, communiquer, respecter les obligations légales.</p>
          <h2>3. Publicités et cookies (Google AdSense)</h2>
          <p>Nous pouvons afficher des annonces via <strong>Google AdSense</strong>. Google utilise des cookies (notamment DART) pour diffuser des annonces basées sur vos visites. Désactivation possible sur <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">les paramètres publicitaires Google</a>.</p>
          <h2>4. Partage des données</h2>
          <p>Nous ne vendons pas vos données. Partage uniquement avec des prestataires de confiance.</p>
          <h2>5. Vos droits (RGPD)</h2>
          <ul>
            <li>Accès, rectification, effacement, opposition, portabilité.</li>
          </ul>
          <p>Contactez-nous via la <a href="/legal/contact">page Contact</a>.</p>
          <h2>6. Sécurité</h2>
          <p>HTTPS, Row-Level Security, authentification sécurisée.</p>
          <h2>7. Conservation</h2>
          <p>Pendant l'utilisation du service et selon les obligations légales.</p>
          <h2>8. Modifications</h2>
          <p>Cette politique peut être mise à jour ; la date sera modifiée ci-dessus.</p>
        </>
      ),
    },
  });
  return <LegalLayout title={c.title} description={c.desc} updated="2026-05-07">{c.body}</LegalLayout>;
}