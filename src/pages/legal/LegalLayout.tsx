import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

interface Props {
  title: string;
  description?: string;
  updated?: string;
  children: ReactNode;
}

export function LegalLayout({ title, description, updated, children }: Props) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-[#030308] text-white">
      <SEO title={`${title} — H&Lavage`} description={description} />
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-white hover:text-cyan-300 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <span className="text-xs font-black">H&L</span>
            </div>
            <span className="font-bold text-sm">H&Lavage</span>
          </Link>
          <Link to="/" className="text-xs text-white/60 hover:text-white flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            {isAr ? "العودة" : i18n.language === "fr" ? "Retour" : "Back"}
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-black mb-3 bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
          {title}
        </h1>
        {updated && (
          <p className="text-xs text-white/50 mb-8">
            {isAr ? "آخر تحديث: " : i18n.language === "fr" ? "Dernière mise à jour : " : "Last updated: "}
            {updated}
          </p>
        )}
        <article className="prose prose-invert max-w-none prose-headings:text-white prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-p:text-white/75 prose-p:leading-relaxed prose-li:text-white/75 prose-a:text-cyan-300 prose-strong:text-white">
          {children}
        </article>
      </main>
      <footer className="border-t border-white/10 bg-black/40 px-6 py-6 mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-white/50">
          <Link to="/legal/privacy" className="hover:text-cyan-300">{isAr ? "الخصوصية" : i18n.language === "fr" ? "Confidentialité" : "Privacy"}</Link>
          <Link to="/legal/terms" className="hover:text-cyan-300">{isAr ? "الشروط" : i18n.language === "fr" ? "Conditions" : "Terms"}</Link>
          <Link to="/legal/about" className="hover:text-cyan-300">{isAr ? "من نحن" : "About"}</Link>
          <Link to="/legal/contact" className="hover:text-cyan-300">{isAr ? "تواصل" : "Contact"}</Link>
          <Link to="/legal/community" className="hover:text-cyan-300">{isAr ? "المجتمع" : i18n.language === "fr" ? "Communauté" : "Community"}</Link>
        </div>
      </footer>
    </div>
  );
}

export function pickLang<T>(i18nLang: string, dict: { ar: T; en: T; fr: T }): T {
  if (i18nLang === "ar") return dict.ar;
  if (i18nLang === "en") return dict.en;
  return dict.fr;
}