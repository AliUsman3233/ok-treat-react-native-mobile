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

// Initialize i18next synchronously at module load. Doing this here (rather
// than in an async useEffect from App.js) guarantees i18n.isInitialized is
// true BEFORE any screen mounts and calls useTranslation() — otherwise the
// hook returns a t() that resolves to raw keys until the async init lands.
i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguageGuess() || 'en-us',
  fallbackLng: 'en-us',
  ns: ['translation'],
  defaultNS: 'translation',
  keySeparator: '.',
  nsSeparator: ':',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false,
  },
  debug: false,
});

// Defensive: explicitly register each resource bundle. In some Metro/JSON
// import edge cases the inline `resources` above doesn't get persisted into
// the resourceStore (we saw t() return raw keys on a real device). Calling
// addResourceBundle a second time is a no-op if the data already exists,
// so this is safe to always run.
try {
  Object.entries(resources).forEach(([lng, bundles]) => {
    Object.entries(bundles).forEach(([ns, data]) => {
      i18n.addResourceBundle(lng, ns, data, true, true);
    });
  });
} catch (e) {
  // eslint-disable-next-line no-console
  if (__DEV__) console.warn('[i18n] addResourceBundle failed:', e?.message);
}

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(
    '[i18n] post-init. exists?',
    !!i18n.getResource('en-us', 'translation', 'settings'),
    '| t(settings.title)=',
    i18n.t('settings.title'),
    '| t(translation:settings.title)=',
    i18n.t('translation:settings.title'),
    '| getResource(settings.title)=',
    i18n.getResource('en-us', 'translation', 'settings.title'),
    '| keySep=',
    i18n.options?.keySeparator,
    'nsSep=',
    i18n.options?.nsSeparator
  );
}

/**
 * Apply a saved language (from AsyncStorage) once the app has read it.
 * Safe to call multiple times. The base init above already set a sensible
 * default from the device locale.
 */
export async function initI18n(savedLanguage) {
  const lng = savedLanguage || deviceLanguageGuess() || 'en-us';
  if (i18n.language !== lng) {
    try {
      await i18n.changeLanguage(lng);
    } catch (e) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.warn('[i18n] changeLanguage failed:', e?.message);
    }
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[i18n] ready. lng=' + i18n.language + ', sample t(settings.title)=' + i18n.t('settings.title'));
  }
  return i18n;
}

export default i18n;
