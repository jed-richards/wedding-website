/** Pure phone-number normalization/formatting, kept free of any Supabase or
 * request dependencies (mirrors importParties.ts) so the rules are easy to
 * reason about and unit-test in isolation. Numbers are optional everywhere
 * they're collected, so a blank value is always valid — only a present but
 * unusable value is rejected. */

export type NormalizeResult =
  { ok: true; value: string | null } | { ok: false; error: string };

/** Normalizes a raw form value into E.164 (`+1XXXXXXXXXX`) so every stored
 * number has one consistent shape. Accepts a bare 10-digit US number or an
 * 11-digit number already carrying a leading "1"; anything else (too few/too
 * many digits, non-US country code, letters) is rejected. Blank/whitespace
 * input is allowed since the field is optional. */
export function normalizePhone(raw: unknown): NormalizeResult {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) {
    return { ok: true, value: null };
  }

  const digits = trimmed.replace(/[^0-9]/g, "");
  let tenDigits: string;
  if (digits.length === 10) {
    tenDigits = digits;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    tenDigits = digits.slice(1);
  } else {
    return {
      ok: false,
      error: "Enter a 10-digit US phone number, or leave it blank.",
    };
  }

  return { ok: true, value: `+1${tenDigits}` };
}

/** Formats a stored E.164 number for display, e.g. "+14025551234" ->
 * "(402) 555-1234". Falls back to the raw value for anything that doesn't
 * match the expected shape (shouldn't happen for values that went through
 * normalizePhone, but keeps display code from throwing on bad data). */
export function formatPhone(value: string | null): string {
  if (!value) return "";
  const match = value.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!match) return value;
  const [, area, prefix, line] = match;
  return `(${area}) ${prefix}-${line}`;
}
