const GHANA_COUNTRY_CODE = "233";

export function normalizeWhatsAppNumber(value: string | null | undefined): string {
  let digits = (value ?? "").replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(`${GHANA_COUNTRY_CODE}0`)) {
    digits = `${GHANA_COUNTRY_CODE}${digits.slice(GHANA_COUNTRY_CODE.length + 1)}`;
  } else if (digits.length === 10 && digits.startsWith("0")) {
    digits = `${GHANA_COUNTRY_CODE}${digits.slice(1)}`;
  } else if (digits.length === 9 && /^[25]/.test(digits)) {
    digits = `${GHANA_COUNTRY_CODE}${digits}`;
  }

  return digits;
}

export function isValidWhatsAppNumber(value: string | null | undefined): boolean {
  const digits = normalizeWhatsAppNumber(value);
  return digits.length >= 8 && digits.length <= 15 && !digits.startsWith("0");
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  const number = normalizeWhatsAppNumber(phone);
  if (!isValidWhatsAppNumber(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
