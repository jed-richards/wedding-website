import { fail } from "@sveltejs/kit";
import { createServiceClient } from "$lib/server/supabase";
import { loadPartyDirectory } from "$lib/server/partyDirectory";
import { resolveParty } from "$lib/partySearch";
import { normalizePhone } from "$lib/phone";
import type { Actions, PageServerLoad } from "./$types";

const PARTY_COOKIE = "party_id";

async function loadParty(
  supabase: ReturnType<typeof createServiceClient>,
  partyId: string,
) {
  const { data: party } = await supabase
    .from("parties")
    .select(
      "id, party_name, display_name, max_party_size, plus_ones, attending_count, dietary_notes, phone",
    )
    .eq("id", partyId)
    .maybeSingle();
  return party;
}

export const load: PageServerLoad = async ({ cookies, platform }) => {
  const partyId = cookies.get(PARTY_COOKIE);
  if (!partyId) return { session: null };

  const supabase = createServiceClient(platform!.env);
  const party = await loadParty(supabase, partyId);
  if (!party) {
    // Stale/invalid cookie (party deleted, etc) — fall back to the name gate.
    cookies.delete(PARTY_COOKIE, { path: "/rsvp" });
    return { session: null };
  }

  return { session: { party } };
};

export const actions: Actions = {
  verify: async ({ request, cookies, platform }) => {
    const formData = await request.formData();
    const partyName = String(formData.get("party_name") ?? "").trim();
    const noSuggestions: string[] = [];
    if (!partyName) {
      return fail(400, { error: "Enter your party name.", suggestions: noSuggestions });
    }

    const supabase = createServiceClient(platform!.env);
    const parties = await loadPartyDirectory(supabase);
    const result = resolveParty(partyName, parties);

    if (result.kind === "none") {
      return fail(401, {
        error:
          "We couldn't find that name. Try your first or last name, or the name on your invitation.",
        suggestions: noSuggestions,
      });
    }

    if (result.kind === "ambiguous") {
      return fail(400, {
        error: "That matches more than one party — pick yours below.",
        suggestions: result.matches.map((party) => party.display_name),
      });
    }

    cookies.set(PARTY_COOKIE, result.party.id, {
      path: "/rsvp",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180,
    });

    return { verified: true };
  },

  submit: async ({ request, cookies, platform }) => {
    const partyId = cookies.get(PARTY_COOKIE);
    if (!partyId) {
      return fail(401, {
        error: "Your session expired. Please enter your party name again.",
      });
    }

    const supabase = createServiceClient(platform!.env);

    const { data: party } = await supabase
      .from("parties")
      .select("max_party_size")
      .eq("id", partyId)
      .maybeSingle();
    if (!party) {
      return fail(401, {
        error: "Your session expired. Please enter your party name again.",
      });
    }

    const formData = await request.formData();
    const rawCount = formData.get("attending_count");
    const attendingCount = Number(rawCount);
    if (
      rawCount === null ||
      !Number.isInteger(attendingCount) ||
      attendingCount < 0 ||
      attendingCount > party.max_party_size
    ) {
      return fail(400, {
        error: "Please choose a valid number of attendees.",
      });
    }

    const dietaryNotes =
      attendingCount > 0
        ? String(formData.get("dietary_notes") ?? "").trim() || null
        : null;

    const phoneResult = normalizePhone(formData.get("phone"));
    if (!phoneResult.ok) {
      return fail(400, { error: phoneResult.error });
    }

    const { error } = await supabase
      .from("parties")
      .update({
        attending_count: attendingCount,
        dietary_notes: dietaryNotes,
        // Kept even when attending_count is 0 — a regretting party's number
        // is still worth having, unlike dietary notes.
        phone: phoneResult.value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", partyId);
    if (error) {
      return fail(500, {
        error: "Something went wrong saving your RSVP. Please try again.",
      });
    }

    return { saved: true };
  },
};
