import { fail } from "@sveltejs/kit";
import { createServiceClient } from "$lib/server/supabase";
import {
  isAdmin,
  setAdminSession,
  clearAdminSession,
  verifyAdminPassword,
} from "$lib/server/auth";
import { parseCsv } from "$lib/csv";
import type { Actions, PageServerLoad } from "./$types";

const CSV_REQUIRED_COLUMNS = [
  "party_name",
  "passcode",
  "first_name",
  "last_name",
] as const;

type ParsedGuestRow = {
  partyName: string;
  passcode: string;
  firstName: string;
  lastName: string;
};

/** Parses and validates an uploaded CSV into per-row guest data, or a single
 * user-facing error message describing everything wrong with the file. */
function parseGuestCsv(text: string): { rows: ParsedGuestRow[] } | { error: string } {
  const csvRows = parseCsv(text).filter((row) =>
    row.some((cell) => cell.trim() !== ""),
  );
  if (csvRows.length === 0) return { error: "The CSV file is empty." };

  const [header, ...dataRows] = csvRows;
  const columns = header.map((cell) => cell.trim().toLowerCase());
  const missingColumns = CSV_REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missingColumns.length > 0) {
    return {
      error: `The CSV is missing column(s): ${missingColumns.join(", ")}. Expected: ${CSV_REQUIRED_COLUMNS.join(", ")}.`,
    };
  }

  const columnIndex = Object.fromEntries(
    CSV_REQUIRED_COLUMNS.map((c) => [c, columns.indexOf(c)]),
  ) as Record<(typeof CSV_REQUIRED_COLUMNS)[number], number>;

  const rows: ParsedGuestRow[] = [];
  const rowErrors: string[] = [];

  dataRows.forEach((row, i) => {
    const rowNumber = i + 2; // +1 for the header row, +1 for 1-indexing
    const partyName = (row[columnIndex.party_name] ?? "").trim();
    const passcode = (row[columnIndex.passcode] ?? "").trim();
    const firstName = (row[columnIndex.first_name] ?? "").trim();
    const lastName = (row[columnIndex.last_name] ?? "").trim();

    if (!partyName || !passcode || !firstName || !lastName) {
      rowErrors.push(
        `Row ${rowNumber}: party name, passcode, first name, and last name are all required.`,
      );
      return;
    }

    rows.push({ partyName, passcode, firstName, lastName });
  });

  if (rowErrors.length > 0) {
    return { error: `Fix these rows and re-upload:\n${rowErrors.join("\n")}` };
  }

  return { rows };
}

/** Groups parsed CSV rows into one entry per party name. A party name that
 * appears with more than one passcode is reported as an error, since the CSV
 * doesn't say which passcode should win. */
function groupRowsByParty(rows: ParsedGuestRow[]):
  | {
      parties: Map<
        string,
        { passcode: string; guests: { firstName: string; lastName: string }[] }
      >;
    }
  | { error: string } {
  const parties = new Map<
    string,
    { passcode: string; guests: { firstName: string; lastName: string }[] }
  >();

  for (const row of rows) {
    const existing = parties.get(row.partyName);
    if (!existing) {
      parties.set(row.partyName, {
        passcode: row.passcode,
        guests: [{ firstName: row.firstName, lastName: row.lastName }],
      });
      continue;
    }

    if (existing.passcode !== row.passcode) {
      return {
        error: `"${row.partyName}" appears with more than one passcode in the file — use the same passcode for every row in a party.`,
      };
    }
    existing.guests.push({ firstName: row.firstName, lastName: row.lastName });
  }

  return { parties };
}

async function loadDashboard(supabase: ReturnType<typeof createServiceClient>) {
  const { data: parties } = await supabase
    .from("parties")
    .select(
      "id, party_name, passcode, guests(id, first_name, last_name, is_attending, meal_choice, dietary_notes)",
    )
    .order("party_name");

  const allGuests = (parties ?? []).flatMap((p) => p.guests ?? []);
  const summary = {
    totalGuests: allGuests.length,
    attending: allGuests.filter((g) => g.is_attending === true).length,
    notAttending: allGuests.filter((g) => g.is_attending === false).length,
    noResponse: allGuests.filter((g) => g.is_attending === null).length,
    mealCounts: allGuests.reduce<Record<string, number>>((acc, g) => {
      if (g.meal_choice) acc[g.meal_choice] = (acc[g.meal_choice] ?? 0) + 1;
      return acc;
    }, {}),
  };

  return { parties: parties ?? [], summary };
}

export const load: PageServerLoad = async ({ cookies, platform }) => {
  const env = platform!.env;
  if (!(await isAdmin(cookies, env))) {
    return { authed: false as const };
  }

  const supabase = createServiceClient(env);
  const dashboard = await loadDashboard(supabase);
  return { authed: true as const, ...dashboard };
};

export const actions: Actions = {
  login: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    const formData = await request.formData();
    const password = String(formData.get("password") ?? "");

    if (!(await verifyAdminPassword(env, password))) {
      return fail(401, { error: "Incorrect password." });
    }

    await setAdminSession(cookies, env);
    return { loggedIn: true };
  },

  logout: async ({ cookies }) => {
    clearAdminSession(cookies);
    return { loggedOut: true };
  },

  createParty: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await isAdmin(cookies, env))) return fail(401, { error: "Not signed in." });

    const formData = await request.formData();
    const partyName = String(formData.get("party_name") ?? "").trim();
    const passcode = String(formData.get("passcode") ?? "").trim();
    if (!partyName || !passcode) {
      return fail(400, { error: "Party name and passcode are required." });
    }

    const supabase = createServiceClient(env);
    const { error } = await supabase
      .from("parties")
      .insert({ party_name: partyName, passcode });
    if (error) return fail(500, { error: "Could not create party." });

    return { partyCreated: true };
  },

  deleteParty: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await isAdmin(cookies, env))) return fail(401, { error: "Not signed in." });

    const formData = await request.formData();
    const partyId = String(formData.get("party_id") ?? "");
    if (!partyId) return fail(400, { error: "Missing party." });

    const supabase = createServiceClient(env);
    const { error } = await supabase.from("parties").delete().eq("id", partyId);
    if (error) return fail(500, { error: "Could not delete party." });

    return { partyDeleted: true };
  },

  createGuest: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await isAdmin(cookies, env))) return fail(401, { error: "Not signed in." });

    const formData = await request.formData();
    const partyId = String(formData.get("party_id") ?? "");
    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    if (!partyId || !firstName || !lastName) {
      return fail(400, { error: "First name and last name are required." });
    }

    const supabase = createServiceClient(env);
    const { error } = await supabase
      .from("guests")
      .insert({ party_id: partyId, first_name: firstName, last_name: lastName });
    if (error) return fail(500, { error: "Could not add guest." });

    return { guestCreated: true };
  },

  deleteGuest: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await isAdmin(cookies, env))) return fail(401, { error: "Not signed in." });

    const formData = await request.formData();
    const guestId = String(formData.get("guest_id") ?? "");
    if (!guestId) return fail(400, { error: "Missing guest." });

    const supabase = createServiceClient(env);
    const { error } = await supabase.from("guests").delete().eq("id", guestId);
    if (error) return fail(500, { error: "Could not delete guest." });

    return { guestDeleted: true };
  },

  importCsv: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await isAdmin(cookies, env)))
      return fail(401, { csvError: "Not signed in." });

    const formData = await request.formData();
    const file = formData.get("csv_file");
    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { csvError: "Choose a CSV file to import." });
    }

    const parsed = parseGuestCsv(await file.text());
    if ("error" in parsed) return fail(400, { csvError: parsed.error });

    const grouped = groupRowsByParty(parsed.rows);
    if ("error" in grouped) return fail(400, { csvError: grouped.error });

    const supabase = createServiceClient(env);

    // Guest lists here are wedding-scale (dozens to low hundreds), so a full-table
    // fetch to check for conflicts up front is simpler and safer than building
    // dynamic `.in(...)` filters against user-supplied names/passcodes.
    const { data: existingParties } = await supabase
      .from("parties")
      .select("party_name, passcode");
    const existingNames = new Set(
      (existingParties ?? []).map((p) => p.party_name.toLowerCase()),
    );
    const existingPasscodes = new Set(
      (existingParties ?? []).map((p) => p.passcode.toLowerCase()),
    );

    const conflicts: string[] = [];
    for (const [partyName, { passcode }] of grouped.parties) {
      if (existingNames.has(partyName.toLowerCase())) {
        conflicts.push(`Party "${partyName}" already exists.`);
      } else if (existingPasscodes.has(passcode.toLowerCase())) {
        conflicts.push(
          `Passcode "${passcode}" (for "${partyName}") is already used by another party.`,
        );
      }
    }
    if (conflicts.length > 0) {
      return fail(400, {
        csvError: `Import stopped — fix these conflicts first:\n${conflicts.join("\n")}`,
      });
    }

    // Not transactional: if this fails partway through, whatever parties/guests
    // were already inserted stay in the database. Safe to re-run the same file —
    // the conflict check above will skip anything already imported (as long as
    // its party name/passcode matches what's already there).
    let partiesCreated = 0;
    let guestsCreated = 0;
    for (const [partyName, { passcode, guests }] of grouped.parties) {
      const { data: party, error: partyError } = await supabase
        .from("parties")
        .insert({ party_name: partyName, passcode })
        .select("id")
        .single();
      if (partyError || !party) {
        return fail(500, {
          csvError: `Imported ${partiesCreated} part${partiesCreated === 1 ? "y" : "ies"} before failing on "${partyName}". Fix the issue and re-upload the file to pick up where it left off.`,
        });
      }
      partiesCreated++;

      const { error: guestsError } = await supabase.from("guests").insert(
        guests.map((g) => ({
          party_id: party.id,
          first_name: g.firstName,
          last_name: g.lastName,
        })),
      );
      if (guestsError) {
        return fail(500, {
          csvError: `Created party "${partyName}" but could not add its guests. Fix the issue and re-upload the file to pick up where it left off.`,
        });
      }
      guestsCreated += guests.length;
    }

    return { csvImported: true, partiesCreated, guestsCreated };
  },
};
