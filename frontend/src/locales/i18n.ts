import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import frTranslation from "./fr.json";

// Les ressources de traduction
const resources = {
  fr: {
    translation: frTranslation,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "fr", // Langue par défaut
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false, // React fait déjà l'échappement
  },
});

export default i18n;
