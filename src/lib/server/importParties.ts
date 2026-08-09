/** Pure parsing/validation for the /admin JSON bulk-import action. Kept free of
 * any Supabase or request dependencies so the shape/validation rules are easy to
 * reason about (and test) in isolation from the form action that persists them. */

import { normalizePhone } from "$lib/phone";

/** One validated, trimmed party from an import file. The uploaded file uses
 * snake_case keys (`party_name`/`display_name`/`max_party_size`/`plus_ones`/
 * `phone`); those are read at parse time and normalised into this camelCase
 * domain shape. `plusOnes` is how many of `maxPartySize`'s seats are unnamed
 * plus-ones; the rest are the named invitees implied by `displayName`. */
export interface ImportParty {
  partyName: string;
  displayName: string;
  maxPartySize: number;
  plusOnes: number;
  phone: string | null;
}

export type ParseResult =
  { ok: true; parties: ImportParty[] } | { ok: false; errors: string[] };

/** Guards against oversized uploads given Cloudflare Workers' request limits. */
export const MAX_IMPORT_BYTES = 1_000_000;
export const MAX_PARTIES = 500;
/** Sane upper bound on seats for a single party; catches obvious typos. */
export const MAX_PARTY_SIZE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Parse and validate the JSON text of an import file. Returns every problem it
 * finds (so the admin can fix them all at once) rather than stopping at the
 * first, and normalises valid entries with trimmed names. Validation is
 * all-or-nothing: on any error nothing is returned for import, so a partial file
 * never results in a partial write.
 */
export function parseImport(raw: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ["File is not valid JSON."] };
  }

  if (!Array.isArray(data)) {
    return { ok: false, errors: ["Top-level JSON must be an array of parties."] };
  }
  if (data.length === 0) {
    return { ok: false, errors: ["The file contains no parties."] };
  }
  if (data.length > MAX_PARTIES) {
    return {
      ok: false,
      errors: [`Too many parties (${data.length}); the maximum is ${MAX_PARTIES}.`],
    };
  }

  const errors: string[] = [];
  const parties: ImportParty[] = [];
  const seenNames = new Set<string>();

  data.forEach((entry, i) => {
    const positional = `Party ${i + 1}`;
    if (!isRecord(entry)) {
      errors.push(`${positional}: must be an object.`);
      return;
    }

    const partyName = trimmedString(entry.party_name);
    if (!partyName) {
      errors.push(`${positional}: missing "party_name".`);
    }
    const label = partyName ? `"${partyName}"` : positional;

    if (partyName) {
      const key = partyName.toLowerCase();
      if (seenNames.has(key)) {
        errors.push(`${label}: duplicate party name in file.`);
      } else {
        seenNames.add(key);
      }
    }

    // display_name is optional; when omitted it falls back to party_name.
    const displayName = trimmedString(entry.display_name) || partyName;

    // max_party_size is optional and defaults to 1 (just the named party,
    // no plus-ones).
    let maxPartySize = 1;
    if (entry.max_party_size !== undefined) {
      const rawSize = entry.max_party_size;
      if (
        typeof rawSize !== "number" ||
        !Number.isInteger(rawSize) ||
        rawSize < 1 ||
        rawSize > MAX_PARTY_SIZE
      ) {
        errors.push(
          `${label}: "max_party_size" must be a whole number between 1 and ${MAX_PARTY_SIZE}.`,
        );
      } else {
        maxPartySize = rawSize;
      }
    }

    // plus_ones is optional and defaults to 0 (every seat is named); it can't
    // exceed max_party_size.
    let plusOnes = 0;
    if (entry.plus_ones !== undefined) {
      const rawPlusOnes = entry.plus_ones;
      if (
        typeof rawPlusOnes !== "number" ||
        !Number.isInteger(rawPlusOnes) ||
        rawPlusOnes < 0 ||
        rawPlusOnes > maxPartySize
      ) {
        errors.push(
          `${label}: "plus_ones" must be a whole number between 0 and ${maxPartySize} (max_party_size).`,
        );
      } else {
        plusOnes = rawPlusOnes;
      }
    }

    // phone is optional; blank/omitted is fine, present-but-unparseable is an
    // error (same rules as the RSVP and admin forms).
    let phone: string | null = null;
    if (entry.phone !== undefined) {
      if (typeof entry.phone !== "string") {
        errors.push(`${label}: "phone" must be a string.`);
      } else {
        const phoneResult = normalizePhone(entry.phone);
        if (!phoneResult.ok) {
          errors.push(`${label}: ${phoneResult.error}`);
        } else {
          phone = phoneResult.value;
        }
      }
    }

    if (partyName) {
      parties.push({ partyName, displayName, maxPartySize, plusOnes, phone });
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, parties };
}
