import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ar from "./locales/ar";
import fr from "./locales/fr";
import en from "./locales/en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: typeof window !== "undefined" && !localStorage.getItem("lang") ? "fr" : undefined,
    fallbackLng: "fr",
    supportedLngs: ["ar", "fr", "en"],
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
  });

const applyDir = (lng: string) => {
  const normalized = lng.split("-")[0];
  const dir = normalized === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = normalized;
};

applyDir(i18n.language || "fr");
i18n.on("languageChanged", applyDir);

export default i18n;
