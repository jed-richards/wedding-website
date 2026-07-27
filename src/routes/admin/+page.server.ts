import { fail, redirect } from "@sveltejs/kit";
import { createAuthClient, createServiceClient } from "$lib/server/supabase";
import { getAdminSession, requireAdminEmail } from "$lib/server/auth";
import {
  MAX_IMPORT_BYTES,
  MAX_PARTY_SIZE,
  parseImport,
} from "$lib/server/importGuests";
import type { Actions, PageServerLoad } from "./$types";

/** Parses and range-checks a `max_party_size` form field. `minSize` is the
 * number of named guests already on the party (it can't shrink below that). */
function parseMaxPartySize(
  raw: FormDataEntryValue | null,
  minSize: number,
): { ok: true; value: number } | { ok: false; error: string } {
  if (raw === null || String(raw).trim() === "") {
    return { ok: true, value: Math.max(1, minSize) };
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minSize || value > MAX_PARTY_SIZE) {
    return {
      ok: false,
      error: `Party size must be a whole number between ${Math.max(1, minSize)} and ${MAX_PARTY_SIZE}.`,
    };
  }
  return { ok: true, value };
}

async function loadDashboard(supabase: ReturnType<typeof createServiceClient>) {
  const { data: parties } = await supabase
    .from("parties")
    .select(
      "id, party_name, max_party_size, guests(id, first_name, last_name, is_attending, dietary_notes, is_plus_one)",
    )
    .order("party_name");

  const allGuests = (parties ?? []).flatMap((p) => p.guests ?? []);
  const summary = {
    totalGuests: allGuests.length,
    attending: allGuests.filter((g) => g.is_attending === true).length,
    notAttending: allGuests.filter((g) => g.is_attending === false).length,
    noResponse: allGuests.filter((g) => g.is_attending === null).length,
  };

  return { parties: parties ?? [], summary };
}

export const load: PageServerLoad = async ({ cookies, platform }) => {
  const env = platform!.env;
  const session = await getAdminSession(cookies, env);
  if (session.status !== "authed") {
    return {
      authed: false as const,
      notAuthorized: session.status === "not_authorized",
    };
  }

  const supabase = createServiceClient(env);
  const dashboard = await loadDashboard(supabase);
  return { authed: true as const, email: session.email, ...dashboard };
};

export const actions: Actions = {
  login: async ({ url, cookies }) => {
    const supabaseAuth = createAuthClient(cookies);
    const { data, error } = await supabaseAuth.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${url.origin}/admin/auth/callback` },
    });

    if (error || !data.url) {
      return fail(500, { error: "Could not start Google sign-in." });
    }

    throw redirect(303, data.url);
  },

  logout: async ({ cookies }) => {
    const supabaseAuth = createAuthClient(cookies);
    await supabaseAuth.auth.signOut();
    return { loggedOut: true };
  },

  createParty: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await requireAdminEmail(cookies, env)))
      return fail(401, { error: "Not signed in." });

    const formData = await request.formData();
    const partyName = String(formData.get("party_name") ?? "").trim();
    if (!partyName) {
      return fail(400, { error: "Party name is required." });
    }

    const sizeResult = parseMaxPartySize(formData.get("max_party_size"), 1);
    if (!sizeResult.ok) {
      return fail(400, { error: sizeResult.error });
    }

    const supabase = createServiceClient(env);
    const { error } = await supabase
      .from("parties")
      .insert({ party_name: partyName, max_party_size: sizeResult.value });
    if (error) {
      if (error.code === "23505") {
        return fail(400, {
          error:
            'A party with that name already exists. Add a last initial or similar to tell them apart (e.g. "The Smiths - J").',
        });
      }
      return fail(500, { error: "Could not create party." });
    }

    return { partyCreated: true };
  },

  updateParty: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await requireAdminEmail(cookies, env)))
      return fail(401, { error: "Not signed in." });

    const formData = await request.formData();
    const partyId = String(formData.get("party_id") ?? "");
    const partyName = String(formData.get("party_name") ?? "").trim();
    if (!partyId || !partyName) {
      return fail(400, { error: "Party name is required.", partyId });
    }

    const supabase = createServiceClient(env);

    const { count: namedCount, error: countError } = await supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("party_id", partyId)
      .eq("is_plus_one", false);
    if (countError) {
      return fail(500, { error: "Could not update party.", partyId });
    }

    const sizeResult = parseMaxPartySize(
      formData.get("max_party_size"),
      namedCount ?? 1,
    );
    if (!sizeResult.ok) {
      return fail(400, { error: sizeResult.error, partyId });
    }

    const { error } = await supabase
      .from("parties")
      .update({ party_name: partyName, max_party_size: sizeResult.value })
      .eq("id", partyId);
    if (error) {
      if (error.code === "23505") {
        return fail(400, {
          error: "A party with that name already exists.",
          partyId,
        });
      }
      return fail(500, { error: "Could not update party.", partyId });
    }

    return { partyUpdated: true, partyId };
  },

  deleteParty: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await requireAdminEmail(cookies, env)))
      return fail(401, { error: "Not signed in." });

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
    if (!(await requireAdminEmail(cookies, env)))
      return fail(401, { error: "Not signed in." });

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
    if (!(await requireAdminEmail(cookies, env)))
      return fail(401, { error: "Not signed in." });

    const formData = await request.formData();
    const guestId = String(formData.get("guest_id") ?? "");
    if (!guestId) return fail(400, { error: "Missing guest." });

    const supabase = createServiceClient(env);
    const { error } = await supabase.from("guests").delete().eq("id", guestId);
    if (error) return fail(500, { error: "Could not delete guest." });

    return { guestDeleted: true };
  },

  importJson: async ({ request, cookies, platform }) => {
    const env = platform!.env;
    if (!(await requireAdminEmail(cookies, env)))
      return fail(401, { importErrors: ["Not signed in."] });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { importErrors: ["Choose a JSON file to import."] });
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return fail(400, {
        importErrors: [
          `File is too large (${(file.size / 1_000_000).toFixed(1)} MB); the maximum is ${MAX_IMPORT_BYTES / 1_000_000} MB.`,
        ],
      });
    }

    const parsed = parseImport(await file.text());
    if (!parsed.ok) {
      return fail(400, { importErrors: parsed.errors });
    }

    const supabase = createServiceClient(env);

    // party_name is the unique, case-insensitive RSVP key, so reject any name
    // already in the table before inserting. `.in()` is case-sensitive, so
    // compare on lowercased names in memory instead.
    const { data: existing, error: existingError } = await supabase
      .from("parties")
      .select("party_name");
    if (existingError) {
      return fail(500, { importErrors: ["Could not check existing parties."] });
    }
    const existingNames = new Set(
      (existing ?? []).map((p) => p.party_name.toLowerCase()),
    );
    const duplicates = parsed.parties.filter((p) =>
      existingNames.has(p.partyName.toLowerCase()),
    );
    if (duplicates.length > 0) {
      return fail(400, {
        importErrors: duplicates.map(
          (p) =>
            `Party "${p.partyName}" already exists — rename it or remove it from the file.`,
        ),
      });
    }

    // Two batched inserts (parties, then their guests) instead of a round trip
    // per row. Postgres has no cross-statement transaction here, so if the guest
    // insert fails we delete the just-created parties to avoid orphaned parties.
    const { data: insertedParties, error: partyError } = await supabase
      .from("parties")
      .insert(
        parsed.parties.map((p) => ({
          party_name: p.partyName,
          max_party_size: p.maxPartySize,
        })),
      )
      .select("id, party_name");
    if (partyError || !insertedParties) {
      if (partyError?.code === "23505") {
        return fail(400, {
          importErrors: [
            "A party name collided during import (created elsewhere just now). Re-check for duplicates and try again.",
          ],
        });
      }
      return fail(500, { importErrors: ["Could not import parties."] });
    }

    const idByName = new Map(
      insertedParties.map((p) => [p.party_name.toLowerCase(), p.id]),
    );
    const guestRows = parsed.parties.flatMap((party) =>
      party.guests.map((guest) => ({
        party_id: idByName.get(party.partyName.toLowerCase())!,
        first_name: guest.firstName,
        last_name: guest.lastName,
      })),
    );

    const { error: guestError } = await supabase.from("guests").insert(guestRows);
    if (guestError) {
      await supabase
        .from("parties")
        .delete()
        .in(
          "id",
          insertedParties.map((p) => p.id),
        );
      return fail(500, {
        importErrors: ["Could not import guests; the import was rolled back."],
      });
    }

    return {
      imported: {
        parties: insertedParties.length,
        guests: guestRows.length,
      },
    };
  },
};
