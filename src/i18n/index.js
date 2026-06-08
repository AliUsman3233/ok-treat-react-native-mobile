// Centralized i18n setup for the OkTreat mobile app.
//
// How to use in any screen:
//
//   import { useTranslation } from 'react-i18next';
//
//   function MyScreen() {
//     const { t } = useTranslation();
//     return <Text>{t('home.welcome')}</Text>;
//   }
//
// Adding a new key:
//   1. Add it to src/i18n/locales/en-us.json (the source of truth).
//   2. Add the same key to the other locale files (ja.json, zh.json, en-uk.json).
//   3. Reference it in code via t('namespace.key').
//
// Adding a new language:
//   1. Drop a JSON file at src/i18n/locales/<code>.json.
//   2. Import + register it in `resources` below.
//   3. Add the language to LanguageScreen's `languages` array.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import enUs from './locales/en-us.json';
import enUk from './locales/en-uk.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en-us', name: 'English (US)' },
  { code: 'en-uk', name: 'English (UK)' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
];

const resources = {
  'en-us': { translation: enUs },
  'en-uk': { translation: enUk },
  ja: { translation: ja },
  zh: { translation: zh },
};

// Map a device locale ("en-US", "ja-JP", "zh-Hans-CN") to our supported codes.
// Returns null if no match — caller falls back to en-us.
function deviceLanguageGuess() {
  try {
    const locales = Localization.getLocales?.() || [];
    const first = locales[0];
    if (!first) return null;
    const tag = (first.languageTag || '').toLowerCase();
    const lang = (first.languageCode || '').toLowerCase();
    if (tag.startsWith('en-gb') || tag.startsWith('en-uk')) return 'en-uk';
    if (lang === 'en') return 'en-us';
    if (lang === 'ja') return 'ja';
    if (lang === 'zh') return 'zh';
    return null;
  } catch {
    return null;
  }
}

/**
 * Initialize i18next. Call once at app startup, passing the saved language
 * from AsyncStorage (or null on first launch — we'll fall back to device
 * locale → en-us).
 */
export async function initI18n(savedLanguage) {
  const lng = savedLanguage || deviceLanguageGuess() || 'en-us';
  if (i18n.isInitialized) {
    // Hot-reload case — just switch language.
    await i18n.changeLanguage(lng);
    return i18n;
  }
  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en-us',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    returnEmptyString: false, // missing key → fall back to en-us
    react: {
      useSuspense: false,
    },
  });
  return i18n;
}

export default i18n;
