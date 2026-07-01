// Phone-number helpers for the app. Keep every screen consistent:
//   - default country code comes from the device locale, not "+1"
//   - phone digits are stored on the backend as clean E.164
//     (e.g. "+923001234567") so downstream consumers don't have to
//     guess about hyphens/spaces
//   - legacy formats (hyphenated 4-segment US-style, raw strings,
//     "+CODE-XXX-XXXX-XXXX", etc) are parsed on load into
//     { dialCode, national } so users don't lose data on migration.

import * as Localization from 'expo-localization';

// Small map of common regions → dial code + flag. Covers the popular
// countries pinned in the picker (`us,gb,ca,au,in,pk,ae,sa`) plus a
// few extras. Anything outside falls back to `+1 US`. Users can still
// pick any country from the full picker.
const REGION_INFO = {
  US: { dial: '+1',   flag: '🇺🇸' },
  CA: { dial: '+1',   flag: '🇨🇦' },
  GB: { dial: '+44',  flag: '🇬🇧' },
  IE: { dial: '+353', flag: '🇮🇪' },
  AU: { dial: '+61',  flag: '🇦🇺' },
  NZ: { dial: '+64',  flag: '🇳🇿' },
  IN: { dial: '+91',  flag: '🇮🇳' },
  PK: { dial: '+92',  flag: '🇵🇰' },
  BD: { dial: '+880', flag: '🇧🇩' },
  AE: { dial: '+971', flag: '🇦🇪' },
  SA: { dial: '+966', flag: '🇸🇦' },
  QA: { dial: '+974', flag: '🇶🇦' },
  KW: { dial: '+965', flag: '🇰🇼' },
  OM: { dial: '+968', flag: '🇴🇲' },
  DE: { dial: '+49',  flag: '🇩🇪' },
  FR: { dial: '+33',  flag: '🇫🇷' },
  IT: { dial: '+39',  flag: '🇮🇹' },
  ES: { dial: '+34',  flag: '🇪🇸' },
  NL: { dial: '+31',  flag: '🇳🇱' },
  BE: { dial: '+32',  flag: '🇧🇪' },
  CH: { dial: '+41',  flag: '🇨🇭' },
  SE: { dial: '+46',  flag: '🇸🇪' },
  NO: { dial: '+47',  flag: '🇳🇴' },
  DK: { dial: '+45',  flag: '🇩🇰' },
  FI: { dial: '+358', flag: '🇫🇮' },
  PL: { dial: '+48',  flag: '🇵🇱' },
  TR: { dial: '+90',  flag: '🇹🇷' },
  RU: { dial: '+7',   flag: '🇷🇺' },
  UA: { dial: '+380', flag: '🇺🇦' },
  CN: { dial: '+86',  flag: '🇨🇳' },
  JP: { dial: '+81',  flag: '🇯🇵' },
  KR: { dial: '+82',  flag: '🇰🇷' },
  HK: { dial: '+852', flag: '🇭🇰' },
  SG: { dial: '+65',  flag: '🇸🇬' },
  MY: { dial: '+60',  flag: '🇲🇾' },
  ID: { dial: '+62',  flag: '🇮🇩' },
  PH: { dial: '+63',  flag: '🇵🇭' },
  TH: { dial: '+66',  flag: '🇹🇭' },
  VN: { dial: '+84',  flag: '🇻🇳' },
  ZA: { dial: '+27',  flag: '🇿🇦' },
  NG: { dial: '+234', flag: '🇳🇬' },
  KE: { dial: '+254', flag: '🇰🇪' },
  EG: { dial: '+20',  flag: '🇪🇬' },
  BR: { dial: '+55',  flag: '🇧🇷' },
  MX: { dial: '+52',  flag: '🇲🇽' },
  AR: { dial: '+54',  flag: '🇦🇷' },
};

const FALLBACK = { dial: '+1', flag: '🇺🇸' };

/**
 * Default country for phone inputs. Product decision (2026-06-16): the
 * default is ALWAYS US regardless of device locale. Users on non-US
 * devices can still open the picker and select their country in one
 * tap. Rationale: consistent screenshots / support / testing.
 *
 * Localization import is kept in case we want to flip back to a
 * locale-derived default later.
 */
export function defaultCountryInfo() {
  return FALLBACK;
}

/**
 * Convert a 2-letter region code (US, PK, GB) to its flag emoji using
 * the Unicode Regional Indicator Symbols. Useful when the picker gives
 * us a region but not a flag.
 */
export function regionToFlag(region) {
  if (!region || typeof region !== 'string' || region.length !== 2) return '';
  const base = 0x1F1E6; // 'A'
  const upper = region.toUpperCase();
  return String.fromCodePoint(base + upper.charCodeAt(0) - 65)
       + String.fromCodePoint(base + upper.charCodeAt(1) - 65);
}

/**
 * Given a dial code like "+92", find a plausible flag by searching our
 * REGION_INFO map. Multiple regions share dial codes (e.g. +1 for US +
 * Canada); we return the first match. The picker owns the "real"
 * source of truth when the user actively selects a country.
 */
export function flagForDialCode(dial) {
  if (!dial) return FALLBACK.flag;
  const normalized = dial.startsWith('+') ? dial : '+' + dial;
  const entry = Object.values(REGION_INFO).find((v) => v.dial === normalized);
  return entry ? entry.flag : FALLBACK.flag;
}

/**
 * Parse a saved phone value in any format we've historically stored:
 *   - E.164 "+923001234567"
 *   - Concatenated "+15551234567"
 *   - Hyphenated "+1-555-1234-5678"
 *   - Raw digits "5551234567" (no country code)
 *   - "+1 555 1234 5678" or messy user-typed strings
 *
 * Returns { dialCode, national }. If we can't identify a country code
 * prefix in the input, dialCode defaults from the device locale and
 * the whole numeric string becomes `national`.
 */
export function parsePhone(saved) {
  const fallback = defaultCountryInfo();
  if (!saved || typeof saved !== 'string' || !saved.trim()) {
    return { dialCode: fallback.dial, national: '' };
  }

  // Strip everything except digits and a leading +
  const trimmed = saved.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (!digits) return { dialCode: fallback.dial, national: '' };

  if (!hasPlus) {
    // No + prefix — assume digits are all national and use device dial
    return { dialCode: fallback.dial, national: digits };
  }

  // Try progressively longer country-code prefixes (1, 2, 3 digits)
  // against our REGION_INFO. First match wins.
  const knownDials = new Set(Object.values(REGION_INFO).map((v) => v.dial));
  for (const len of [1, 2, 3]) {
    const candidate = '+' + digits.slice(0, len);
    if (knownDials.has(candidate)) {
      return { dialCode: candidate, national: digits.slice(len) };
    }
  }

  // Nothing matched — fall back: assume 1-digit dial (US-style).
  return { dialCode: '+' + digits.slice(0, 1), national: digits.slice(1) };
}

/**
 * Build a clean E.164 string from a dial code + national number.
 * Strips any user-typed spaces/hyphens/parens. Returns empty string if
 * national is empty (caller decides how to handle).
 */
export function toE164(dialCode, national) {
  const dialDigits = (dialCode || '').replace(/[^0-9]/g, '');
  const nationalDigits = (national || '').replace(/[^0-9]/g, '');
  if (!nationalDigits) return '';
  return '+' + dialDigits + nationalDigits;
}

/**
 * Loose E.164 validation. E.164 spec is + followed by up to 15 digits,
 * and national numbers are typically at least 7 digits after the country
 * code. Returns true if the (dialCode, national) pair looks like a
 * plausible international phone.
 */
export function isValidPhone(dialCode, national) {
  const nationalDigits = (national || '').replace(/[^0-9]/g, '');
  const dialDigits = (dialCode || '').replace(/[^0-9]/g, '');
  if (!dialDigits) return false;
  const total = dialDigits.length + nationalDigits.length;
  // ITU E.164: max 15 digits total; national portion at least 6
  // (some short codes/local numbers are shorter but for a personal
  //  phone, this is a reasonable floor).
  return nationalDigits.length >= 6 && total <= 15;
}
