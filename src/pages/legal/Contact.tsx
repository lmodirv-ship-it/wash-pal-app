import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LegalLayout, pickLang } from "./LegalLayout";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const { i18n } = useTranslation();
  const [sending, setSending] = useState(false);
  const c = pickLang(i18n.language, {
    ar: {
      title: "تواصل معنا",
      desc: "نحن هنا للإجابة على أسئلتك. تواصل مع فريق H&Lavage في أي وقت.",
      name: "الاسم", email: "البريد الإلكتروني", message: "رسالتك",
      send: "إرسال", sent: "تم إرسال رسالتك. سنرد قريباً.",
      addressTitle: "العنوان", emailTitle: "البريد الإلكتروني", whatsappTitle: "واتساب",
      address: "الدار البيضاء، المغرب",
      lead: "هل تحتاج مساعدة أو لديك اقتراح؟ املأ النموذج أو راسلنا مباشرة.",
    },
    en: {
      title: "Contact us",
      desc: "We're here to answer your questions. Reach the H&Lavage team anytime.",
      name: "Name", email: "Email", message: "Your message",
      send: "Send", sent: "Message sent. We'll get back to you shortly.",
      addressTitle: "Address", emailTitle: "Email", whatsappTitle: "WhatsApp",
      address: "Casablanca, Morocco",
      lead: "Need help or have a suggestion? Fill the form or reach us directly.",
    },
    fr: {
      title: "Contactez-nous",
      desc: "Nous sommes là pour répondre à vos questions. Contactez l'équipe H&Lavage.",
      name: "Nom", email: "Email", message: "Votre message",
      send: "Envoyer", sent: "Message envoyé. Nous vous répondrons bientôt.",
      addressTitle: "Adresse", emailTitle: "Email", whatsappTitle: "WhatsApp",
      address: "Casablanca, Maroc",
      lead: "Besoin d'aide ou suggestion ? Remplissez le formulaire ou contactez-nous directement.",
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    const fd = new FormData(e.currentTarget);
    const subject = encodeURIComponent(`Contact from ${fd.get("name")}`);
    const body = encodeURIComponent(`${fd.get("message")}\n\nFrom: ${fd.get("email")}`);
    window.location.href = `mailto:contact@lavagenizar.com?subject=${subject}&body=${body}`;
    toast.success(c.sent);
    setSending(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <LegalLayout title={c.title} description={c.desc}>
      <p className="lead">{c.lead}</p>
      <div className="not-prose grid md:grid-cols-3 gap-4 my-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <Mail className="w-5 h-5 text-cyan-300 mb-2" />
          <p className="text-xs text-white/50 mb-1">{c.emailTitle}</p>
          <a href="mailto:contact@lavagenizar.com" className="text-sm text-white hover:text-cyan-300">contact@lavagenizar.com</a>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <MessageCircle className="w-5 h-5 text-cyan-300 mb-2" />
          <p className="text-xs text-white/50 mb-1">{c.whatsappTitle}</p>
          <a href="https://wa.me/212600000000" className="text-sm text-white hover:text-cyan-300">+212 6 00 00 00 00</a>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <MapPin className="w-5 h-5 text-cyan-300 mb-2" />
          <p className="text-xs text-white/50 mb-1">{c.addressTitle}</p>
          <p className="text-sm text-white">{c.address}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="not-prose space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-1.5">{c.name}</label>
          <input name="name" required className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400" />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1.5">{c.email}</label>
          <input type="email" name="email" required className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400" />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1.5">{c.message}</label>
          <textarea name="message" required rows={5} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400" />
        </div>
        <button type="submit" disabled={sending} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold hover:opacity-90 transition disabled:opacity-50">
          {c.send}
        </button>
      </form>
    </LegalLayout>
  );
}