import { fail } from "@sveltejs/kit";
import { createServiceClient } from "$lib/server/supabase";
import type { Actions, PageServerLoad } from "./$types";

const PARTY_COOKIE = "party_id";

async function loadParty(
  supabase: ReturnType<typeof createServiceClient>,
  partyId: string,
) {
  const { data: party } = await supabase
    .from("parties")
    .select("id, party_name")
    .eq("id", partyId)
    .maybeSingle();
  if (!party) return null;

  const { data: guests } = await supabase
    .from("guests")
    .select("id, first_name, last_name, is_attending, dietary_notes")
    .eq("party_id", partyId)
    .order("first_name");

  return { party, guests: guests ?? [] };
}

export const load: PageServerLoad = async ({ cookies, platform }) => {
  const partyId = cookies.get(PARTY_COOKIE);
  if (!partyId) return { session: null };

  const supabase = createServiceClient(platform!.env);
  const session = await loadParty(supabase, partyId);
  if (!session) {
    // Stale/invalid cookie (party deleted, etc) — fall back to the name gate.
    cookies.delete(PARTY_COOKIE, { path: "/rsvp" });
    return { session: null };
  }

  return { session };
};

export const actions: Actions = {
  verify: async ({ request, cookies, platform }) => {
    const formData = await request.formData();
    const partyName = String(formData.get("party_name") ?? "").trim();
    if (!partyName) {
      return fail(400, { error: "Enter your party name." });
    }

    const supabase = createServiceClient(platform!.env);
    const { data: party } = await supabase
      .from("parties")
      .select("id")
      .ilike("party_name", partyName)
      .maybeSingle();

    if (!party) {
      return fail(401, {
        error: "We couldn't find that name. Please double-check and try again.",
      });
    }

    cookies.set(PARTY_COOKIE, party.id, {
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

    // Only ever touch guests that actually belong to this party.
    const { data: partyGuests } = await supabase
      .from("guests")
      .select("id")
      .eq("party_id", partyId);
    const validGuestIds = new Set((partyGuests ?? []).map((g) => g.id));
    if (validGuestIds.size === 0) {
      return fail(401, {
        error: "Your session expired. Please enter your party name again.",
      });
    }

    const formData = await request.formData();
    const updates = [...validGuestIds].map((guestId) => {
      const attending = formData.get(`attending_${guestId}`);
      const notes = formData.get(`notes_${guestId}`);
      return {
        id: guestId,
        is_attending: attending === "yes" ? true : attending === "no" ? false : null,
        dietary_notes: attending === "yes" ? String(notes ?? "").trim() || null : null,
        updated_at: new Date().toISOString(),
      };
    });

    for (const update of updates) {
      const { id, ...fields } = update;
      const { error } = await supabase.from("guests").update(fields).eq("id", id);
      if (error) {
        return fail(500, {
          error: "Something went wrong saving your RSVP. Please try again.",
        });
      }
    }

    return { saved: true };
  },
};
