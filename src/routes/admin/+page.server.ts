import { fail, redirect } from "@sveltejs/kit";
import { createAuthClient, createServiceClient } from "$lib/server/supabase";
import { getAdminSession, requireAdminEmail } from "$lib/server/auth";
import { normalizePhone } from "$lib/phone";
import {
  MAX_IMPORT_BYTES,
  MAX_PARTY_SIZE,
  parseImport,
} from "$lib/server/importParties";
import type { Actions, PageServerLoad } from "./$types";

/** Parses and range-checks a `max_party_size` form field. */
function parseMaxPartySize(
  raw: FormDataEntryValue | null,
): { ok: true; value: number } | { ok: false; error: string } {
  if (raw === null || String(raw).trim() === "") {
    return { ok: true, value: 1 };
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_PARTY_SIZE) {
    return {
      ok: false,
      error: `Party size must be a whole number between 1 and ${MAX_PARTY_SIZE}.`,
    };
  }
  return { ok: true, value };
}

/** Parses and range-checks a `plus_ones` form field against the party's
 * (already-validated) `maxPartySize`. */
function parsePlusOnes(
  raw: FormDataEntryValue | null,
  maxPartySize: number,
): { ok: true; value: number } | { ok: false; error: string } {
  if (raw === null || String(raw).trim() === "") {
    return { ok: true, value: 0 };
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > maxPartySize) {
    return {
      ok: false,
      error: `Plus-ones must be a whole number between 0 and ${maxPartySize} (max party size).`,
    };
  }
  return { ok: true, value };
}

async function loadDashboard(supabase: ReturnType<typeof createServiceClient>) {
  const { data: parties } = await supabase
    .from("parties")
    .select(
      "id, party_name, display_name, max_party_size, plus_ones, attending_count, dietary_notes, phone",
    )
    .order("party_name");

  const rows = parties ?? [];
  const summary = {
    totalSeats: rows.reduce((sum, p) => sum + p.max_party_size, 0),
    attending: rows.reduce((sum, p) => sum + (p.attending_count ?? 0), 0),
    responded: rows.filter((p) => p.attending_count !== null).length,
    noResponse: rows.filter((p) => p.attending_count === null).length,
    withPhone: rows.filter((p) => p.phone !== null).length,
  };

  return { parties: rows, summary };
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
    const displayName = String(formData.get("display_name") ?? "").trim() || partyName;
    if (!partyName) {
      return fail(400, { error: "Party name is required." });
    }

    const sizeResult = parseMaxPartySize(formData.get("max_party_size"));
    if (!sizeResult.ok) {
      return fail(400, { error: sizeResult.error });
    }
    const plusOnesResult = parsePlusOnes(formData.get("plus_ones"), sizeResult.value);
    if (!plusOnesResult.ok) {
      return fail(400, { error: plusOnesResult.error });
    }
    const phoneResult = normalizePhone(formData.get("phone"));
    if (!phoneResult.ok) {
      return fail(400, { error: phoneResult.error });
    }

    const supabase = createServiceClient(env);
    const { error } = await supabase.from("parties").insert({
      party_name: partyName,
      display_name: displayName,
      max_party_size: sizeResult.value,
      plus_ones: plusOnesResult.value,
      phone: phoneResult.value,
    });
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
    const displayName = String(formData.get("display_name") ?? "").trim() || partyName;
    if (!partyId || !partyName) {
      return fail(400, { error: "Party name is required.", partyId });
    }

    const sizeResult = parseMaxPartySize(formData.get("max_party_size"));
    if (!sizeResult.ok) {
      return fail(400, { error: sizeResult.error, partyId });
    }
    const plusOnesResult = parsePlusOnes(formData.get("plus_ones"), sizeResult.value);
    if (!plusOnesResult.ok) {
      return fail(400, { error: plusOnesResult.error, partyId });
    }
    const phoneResult = normalizePhone(formData.get("phone"));
    if (!phoneResult.ok) {
      return fail(400, { error: phoneResult.error, partyId });
    }

    const supabase = createServiceClient(env);
    const { error } = await supabase
      .from("parties")
      .update({
        party_name: partyName,
        display_name: displayName,
        max_party_size: sizeResult.value,
        plus_ones: plusOnesResult.value,
        phone: phoneResult.value,
      })
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

    const { data: insertedParties, error: partyError } = await supabase
      .from("parties")
      .insert(
        parsed.parties.map((p) => ({
          party_name: p.partyName,
          display_name: p.displayName,
          max_party_size: p.maxPartySize,
          plus_ones: p.plusOnes,
          phone: p.phone,
        })),
      )
      .select("id");
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

    return {
      imported: {
        parties: insertedParties.length,
      },
    };
  },
};
