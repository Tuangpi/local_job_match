import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, type Language } from '@ljm/shared';
import en from './locales/en.json';
import my from './locales/my.json';

export const LANGUAGE_STORAGE_KEY = 'ljm.language';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    my: { translation: my },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: 'en',
  supportedLngs: ['my', 'en'],
  interpolation: { escapeValue: false },
});

/** Read the stored language preference, falling back to the default. */
export function getStoredLanguage(): Language {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' || stored === 'my' ? stored : DEFAULT_LANGUAGE;
}

/** Persist and apply a language choice. */
export function setLanguage(language: Language): void {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  void i18n.changeLanguage(language);
  document.documentElement.lang = language;
}

export default i18n;
