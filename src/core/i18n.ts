import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";

export const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en }, es: { translation: es } },
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "vitalio:lang",
      caches: ["localStorage"],
    },
  });

const syncHtml = (lng: string) => {
  document.documentElement.lang = lng.slice(0, 2);
};
syncHtml(i18n.resolvedLanguage ?? "fr");
i18n.on("languageChanged", syncHtml);

export const setLanguage = (lng: Lang) => i18n.changeLanguage(lng);

export default i18n;
