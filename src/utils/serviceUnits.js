// Single source of truth for how each service type is priced and
// displayed. `unit` is the label on the sitter's base-rate input and
// the "/ per X" suffix throughout the app. `pricedBy` drives the
// booking-total math on the owner side and the server-side validation
// on the backend (mirror this file in backend/src/utils/serviceUnits.js
// when adding a new service).
//
// Product decision (2026-07-08, per client): House Sitting, Drop-In,
// Day Care, and Pet Walking are all hour-based — the sitter works a
// few hours within a single day (owners pick a time window in the
// search flow and total = baseRate × hours). Only Boarding is
// day-based (an overnight/multi-day stay; owners pick a date range,
// total = baseRate × days).

export const SERVICE_UNITS = {
  BOARDING:       { unit: 'day',  pricedBy: 'days'  },
  HOUSE_SITTING:  { unit: 'hour', pricedBy: 'hours' },
  DROP_IN_VISITS: { unit: 'hour', pricedBy: 'hours' },
  DAY_CARE:       { unit: 'hour', pricedBy: 'hours' },
  PET_WALKING:    { unit: 'hour', pricedBy: 'hours' },
};

// Safe lookup — returns 'day' defaults for any unknown/legacy service
// type so display code never blows up if a new type ships without
// updating this map.
export function getServiceUnit(serviceType) {
  return SERVICE_UNITS[serviceType] || { unit: 'day', pricedBy: 'days' };
}

export function isHourBasedService(serviceType) {
  return getServiceUnit(serviceType).pricedBy === 'hours';
}

// Coin economy — mirrors the payout defaults (20 coins = $1, 20% cash-out
// fee). Used to show sitters what their coin rate is worth in real dollars
// under the base-rate input.
export const COINS_PER_DOLLAR = 20;
export const CASHOUT_FEE_PERCENT = 20;

// Given a rate in coins, returns { net, gross } USD — gross is face value
// (coins ÷ 20), net is what's kept after the % cash-out fee.
export function coinsToEarnRange(coins) {
  const c = parseFloat(coins) || 0;
  const gross = c / COINS_PER_DOLLAR;
  const net = gross * (1 - CASHOUT_FEE_PERCENT / 100);
  return { net, gross };
}

// "You'll earn between $X and $Y" for a coin rate, or null when the rate is
// empty/zero (so the caller can skip rendering the line).
export function formatEarnRange(coins) {
  const { net, gross } = coinsToEarnRange(coins);
  if (gross <= 0) return null;
  return `You'll earn between $${net.toFixed(2)} and $${gross.toFixed(2)}`;
}

// Duration in whole hours between two HH:mm strings. Rounds up so a
// 30-minute booking bills as one hour — matching how the sitter's
// base rate is quoted.
export function hoursBetween(startTimeHHmm, endTimeHHmm) {
  if (!startTimeHHmm || !endTimeHHmm) return 0;
  const parse = (s) => {
    const [h, m] = s.split(':').map((n) => parseInt(n, 10));
    return h * 60 + m;
  };
  const mins = parse(endTimeHHmm) - parse(startTimeHHmm);
  if (mins <= 0) return 0;
  return Math.ceil(mins / 60);
}

// Whole days between two ISO date strings. Same convention as before —
// a same-day booking counts as 1 day, not 0.
export function daysBetween(startISO, endISO) {
  if (!startISO || !endISO) return 0;
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  if (Number.isNaN(ms)) return 0;
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
}
