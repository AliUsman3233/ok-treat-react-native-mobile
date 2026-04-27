// Extract a usable QR code identifier from raw scanned/pasted data.
// Accepts: bare codes (OKTREAT-A1B2C3), full URLs (https://.../tag/OKTREAT-XXX),
// legacy query-param URLs (?qr-code=...), or raw legacy numeric codes.
export function extractQRCode(data) {
  const trimmed = (data || '').trim();
  if (!trimmed) return '';

  // New format: OKTREAT-XXXXXX (matches inside URLs too, e.g. /tag/OKTREAT-A1B2C3)
  const oktreatMatch = trimmed.match(/OKTREAT-[A-Z0-9]{4,}/i);
  if (oktreatMatch) return oktreatMatch[0].toUpperCase();

  // Legacy URL format: https://.../qr?qr-code=3356525135
  try {
    const url = new URL(trimmed);
    const param = url.searchParams.get('qr-code') || url.searchParams.get('qrCode') || url.searchParams.get('code');
    if (param) return param;
  } catch (_) {}

  // Raw legacy code as-is
  return trimmed;
}
