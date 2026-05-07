import { useTranslation } from "react-i18next";
import { LegalLayout, pickLang } from "./LegalLayout";

export default function Terms() {
  const { i18n } = useTranslation();
  const c = pickLang(i18n.language, {
    ar: {
      title: "شروط الاستخدام",
      desc: "الشروط والأحكام التي تحكم استخدامك لمنصة H&Lavage لإدارة المغاسل.",
      body: (
        <>
          <p>باستخدامك لمنصة <strong>H&Lavage</strong>، فإنك توافق على هذه الشروط. يرجى قراءتها بعناية.</p>
          <h2>1. قبول الشروط</h2>
          <p>استخدامك للخدمة يعني موافقتك الكاملة على هذه الشروط وعلى سياسة الخصوصية.</p>
          <h2>2. الحساب والاشتراك</h2>
          <p>أنت مسؤول عن سرية بيانات الدخول وعن جميع الأنشطة التي تتم من خلال حسابك. الاشتراكات الشهرية قابلة للإلغاء في أي وقت.</p>
          <h2>3. الاستخدام المقبول</h2>
          <ul>
            <li>عدم استخدام المنصة لأي غرض غير قانوني.</li>
            <li>عدم محاولة اختراق أو تعطيل الخدمة.</li>
            <li>عدم رفع محتوى ضار أو مسيء.</li>
          </ul>
          <h2>4. الدفع والفوترة</h2>
          <p>الأسعار معروضة بالدرهم المغربي. الفواتير تُصدر شهرياً. عدم السداد قد يؤدي إلى تعليق الخدمة.</p>
          <h2>5. الملكية الفكرية</h2>
          <p>جميع حقوق المنصة والشعار والمحتوى محفوظة لـ H&Lavage. بياناتك تبقى ملكك.</p>
          <h2>6. إخلاء المسؤولية</h2>
          <p>الخدمة تُقدم "كما هي" دون ضمانات صريحة. لا نتحمل المسؤولية عن الأضرار غير المباشرة.</p>
          <h2>7. الإنهاء</h2>
          <p>يحق لنا تعليق أو إنهاء حسابك في حالة مخالفة هذه الشروط.</p>
          <h2>8. القانون المعمول به</h2>
          <p>تخضع هذه الشروط للقانون المغربي. تختص محاكم الدار البيضاء بأي نزاع.</p>
          <h2>9. التعديلات</h2>
          <p>قد نحدّث الشروط من وقت لآخر. الاستمرار في الاستخدام يعني قبول التعديلات.</p>
        </>
      ),
    },
    en: {
      title: "Terms of Service",
      desc: "Terms governing your use of the H&Lavage car wash management platform.",
      body: (
        <>
          <p>By using <strong>H&Lavage</strong> you agree to these Terms. Please read them carefully.</p>
          <h2>1. Acceptance</h2>
          <p>Using the service means you agree to these Terms and our Privacy Policy.</p>
          <h2>2. Account & subscription</h2>
          <p>You are responsible for your credentials and account activity. Monthly subscriptions can be cancelled anytime.</p>
          <h2>3. Acceptable use</h2>
          <ul>
            <li>No illegal purposes.</li>
            <li>No attempts to hack or disrupt the service.</li>
            <li>No harmful or abusive content.</li>
          </ul>
          <h2>4. Payment & billing</h2>
          <p>Prices in MAD. Invoices issued monthly. Non-payment may result in suspension.</p>
          <h2>5. Intellectual property</h2>
          <p>Platform, brand and content belong to H&Lavage. Your data remains yours.</p>
          <h2>6. Disclaimer</h2>
          <p>Service provided "as is" without express warranties. We are not liable for indirect damages.</p>
          <h2>7. Termination</h2>
          <p>We may suspend or terminate accounts violating these Terms.</p>
          <h2>8. Governing law</h2>
          <p>These Terms are governed by Moroccan law. Casablanca courts have jurisdiction.</p>
          <h2>9. Changes</h2>
          <p>We may update these Terms; continued use means acceptance.</p>
        </>
      ),
    },
    fr: {
      title: "Conditions d'utilisation",
      desc: "Conditions régissant votre utilisation de la plateforme H&Lavage.",
      body: (
        <>
          <p>En utilisant <strong>H&Lavage</strong>, vous acceptez ces conditions.</p>
          <h2>1. Acceptation</h2>
          <p>Utiliser le service vaut acceptation de ces conditions et de notre politique de confidentialité.</p>
          <h2>2. Compte et abonnement</h2>
          <p>Vous êtes responsable de vos identifiants. Les abonnements sont résiliables à tout moment.</p>
          <h2>3. Usage acceptable</h2>
          <ul>
            <li>Aucun usage illégal.</li>
            <li>Aucune tentative d'intrusion.</li>
            <li>Aucun contenu nuisible.</li>
          </ul>
          <h2>4. Paiement</h2>
          <p>Tarifs en MAD. Facturation mensuelle. Non-paiement = suspension possible.</p>
          <h2>5. Propriété intellectuelle</h2>
          <p>La plateforme appartient à H&Lavage. Vos données restent les vôtres.</p>
          <h2>6. Limitation de responsabilité</h2>
          <p>Service fourni "tel quel". Aucune responsabilité pour dommages indirects.</p>
          <h2>7. Résiliation</h2>
          <p>Nous pouvons suspendre tout compte enfreignant ces conditions.</p>
          <h2>8. Droit applicable</h2>
          <p>Droit marocain. Tribunaux de Casablanca compétents.</p>
          <h2>9. Modifications</h2>
          <p>Conditions susceptibles de modification ; usage continu = acceptation.</p>
        </>
      ),
    },
  });
  return <LegalLayout title={c.title} description={c.desc} updated="2026-05-07">{c.body}</LegalLayout>;
}