import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en/common.json";
import vi from "@/locales/vi/common.json";

if (!i18n.isInitialized) {
  // Always start with "en" so SSR and initial client render match.
  // _app.jsx detects the real language after hydration and calls changeLanguage().
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        vi: { translation: vi },
      },
      lng: "en",
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
