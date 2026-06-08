# Internationalization (i18n)

This app uses `react-i18next` for translations. Strings live in
`src/i18n/locales/<code>.json`, are loaded on app startup from
`src/i18n/index.js`, and applied immediately when the user changes
language via the language picker (`src/screens/auth/LanguageScreen.js`).

## Using in a component

```js
import { useTranslation } from 'react-i18next';

function MyScreen() {
  const { t } = useTranslation();
  return <Text>{t('home.welcome')}</Text>;
}
```

## Adding a new key

1. Add the key + English source string to `locales/en-us.json` — this is
   the source of truth. Missing keys in other locales fall back to en-us
   automatically.
2. Add a placeholder (or final translation) for the same key in every
   other locale file (`en-uk.json`, `ja.json`, `zh.json`).
3. Replace the hardcoded string in code with `t('namespace.key')`.

## Adding a new language

1. Drop a `<code>.json` file under `locales/`.
2. Import it and add to `resources` in `src/i18n/index.js`.
3. Add the language to `SUPPORTED_LANGUAGES` in the same file.
4. (Optional) Update `deviceLanguageGuess()` to map the new device
   locale to your code.

## Migration status

Only a handful of strings are wired so far as a demo (`home.welcome`,
`language.*`, `settings.*`). The rest of the app is still hardcoded in
English. Migrate screens incrementally as needed.

## How the picker works

- First-launch flow: shown before login as part of onboarding. On
  Proceed, navigates to `Onboarding`.
- Re-selection flow: opened from `Settings → Language` with
  `route.params.fromSettings === true`. On Proceed, calls `goBack()`
  and the new language applies app-wide instantly.
