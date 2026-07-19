/** Pure parsing/validation for the /admin JSON bulk-import action. Kept free of
 * any Supabase or request dependencies so the shape/validation rules are easy to
 * reason about (and test) in isolation from the form action that persists them. */

/** A single guest as it appears in an uploaded import file, after trimming. */
export interface ImportGuest {
  first_name: string;
  last_name: string;
}

/** One party plus its guests, validated and normalised from an import file. */
export interface ImportParty {
  party_name: string;
  guests: ImportGuest[];
}

export type ParseResult =
  { ok: true; parties: ImportParty[] } | { ok: false; errors: string[] };

/** Guards against oversized uploads given Cloudflare Workers' request limits. */
export const MAX_IMPORT_BYTES = 1_000_000;
export const MAX_PARTIES = 500;

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
        guests.push({ first_name: firstName, last_name: lastName });
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

    if (partyName && guests.length > 0) {
      parties.push({ party_name: partyName, guests });
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, parties };
}
