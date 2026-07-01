// Format a duration for display. Input can be:
//   - a number of minutes
//   - a { startISO, endISO } pair of ISO timestamp strings
//   - two Date-ish values (Date | ISO string | moment)
//
// Output examples:
//   45   → "45 min"
//   60   → "1 hr"
//   80   → "1 hr 20 min"
//   1440 → "1 day"
//   1500 → "1 day 1 hr"

export function formatDuration(input, endInput) {
  const minutes = toMinutes(input, endInput);
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';

  const totalMinutes = Math.round(minutes);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hoursRemainder = totalMinutes - days * 60 * 24;
  const hours = Math.floor(hoursRemainder / 60);
  const mins = hoursRemainder - hours * 60;

  const parts = [];
  if (days > 0) parts.push(days + (days === 1 ? ' day' : ' days'));
  if (hours > 0) parts.push(hours + (hours === 1 ? ' hr' : ' hrs'));
  if (mins > 0 && days === 0) parts.push(mins + ' min');
  return parts.join(' ') || '0 min';
}

function toMinutes(input, endInput) {
  if (typeof input === 'number') return input;
  if (input && typeof input === 'object' && !endInput) {
    // { startISO, endISO } or { start, end }
    const start = input.startISO ?? input.start;
    const end = input.endISO ?? input.end;
    return diffMinutes(start, end);
  }
  return diffMinutes(input, endInput);
}

function diffMinutes(start, end) {
  if (!start || !end) return 0;
  const s = start instanceof Date ? start.getTime() : new Date(start).getTime();
  const e = end instanceof Date ? end.getTime() : new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  return Math.max(0, (e - s) / 60000);
}
