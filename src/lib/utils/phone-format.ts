/**
 * Format a US phone number to E.164 format (+1XXXXXXXXXX).
 * Strips all non-digit characters, prepends +1 if needed.
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("1") && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // Already has country code or international
  if (phone.startsWith("+")) {
    return `+${digits}`;
  }

  return `+1${digits}`;
}

/**
 * Format a phone number for display: (XXX) XXX-XXXX
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const national = digits.startsWith("1") ? digits.slice(1) : digits;

  if (national.length !== 10) return phone;

  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}
