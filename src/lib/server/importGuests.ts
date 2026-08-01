/** Pure parsing/validation for the /admin JSON bulk-import action. Kept free of
 * any Supabase or request dependencies so the shape/validation rules are easy to
 * reason about (and test) in isolation from the form action that persists them. */

/** A single validated, trimmed guest. The uploaded file uses snake_case keys
 * (`first_name`/`last_name`); those are read at parse time and normalised into
 * this camelCase domain shape. */
export interface ImportGuest {
  firstName: string;
  lastName: string;
}

/** One party plus its guests, validated and normalised from an import file.
 * `maxPartySize` is the total number of seats the party has, including any
 * unnamed plus-ones a guest can fill in later at RSVP time; it defaults to
 * the named guest count (no plus-ones) when omitted from the file. */
export interface ImportParty {
  partyName: string;
  maxPartySize: number;
  guests: ImportGuest[];
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

    const guests: ImportGuest[] = [];
    const guestsRaw = entry.guests;
    if (!Array.isArray(guestsRaw) || guestsRaw.length === 0) {
      errors.push(`${label}: "guests" must be a non-empty array.`);
    } else {
      guestsRaw.forEach((guest, j) => {
        if (!isRecord(guest)) {
          errors.push(`${label}, guest ${j + 1}: must be an object.`);
          return;
        }
        const firstName = trimmedString(guest.first_name);
        const lastName = trimmedString(guest.last_name);
        if (!firstName || !lastName) {
          errors.push(
            `${label}, guest ${j + 1}: "first_name" and "last_name" are required.`,
          );
          return;
        }
        guests.push({ firstName, lastName });
      });
    }

    if (partyName) {
      const key = partyName.toLowerCase();
      if (seenNames.has(key)) {
        errors.push(`${label}: duplicate party name in file.`);
      } else {
        seenNames.add(key);
      }
    }

    // max_party_size is optional; when omitted every guest is named and there
    // are no open plus-one slots.
    let maxPartySize = guests.length;
    if (entry.max_party_size !== undefined) {
      const raw = entry.max_party_size;
      if (
        typeof raw !== "number" ||
        !Number.isInteger(raw) ||
        raw < guests.length ||
        raw > MAX_PARTY_SIZE
      ) {
        errors.push(
          `${label}: "max_party_size" must be a whole number between ${guests.length} (the number of named guests) and ${MAX_PARTY_SIZE}.`,
        );
      } else {
        maxPartySize = raw;
      }
    }

    if (partyName && guests.length > 0) {
      parties.push({ partyName, maxPartySize, guests });
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, parties };
}
