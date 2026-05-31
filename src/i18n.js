import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import frTranslation from './locales/fr/translation.json';
import frGroup1 from './locales/fr/group1.json';
import frGroup2 from './locales/fr/group2.json';

import arTranslation from './locales/ar/translation.json';
import arGroup1 from './locales/ar/group1.json';
import arGroup2 from './locales/ar/group2.json';

const resources = {
  fr: {
    translation: frTranslation,
    group1: frGroup1,
    group2: frGroup2
  },
  ar: {
    translation: arTranslation,
    group1: arGroup1,
    group2: arGroup2
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // react already safes from xss
    }
  });

export default i18n;
