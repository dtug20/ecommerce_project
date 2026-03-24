import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/locales/en/common.json";
import vi from "@/locales/vi/common.json";

if (!i18n.isInitialized) {
  // Only attach LanguageDetector on client side — it accesses localStorage
  // which crashes during SSR and in Safari Private Browsing
  if (typeof window !== 'undefined') {
    i18n.use(LanguageDetector);
  }
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        vi: { translation: vi },
      },
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "i18nextLng",
      },
    });
}

export default i18n;
