import { fail } from "@sveltejs/kit";
import { createServiceClient } from "$lib/server/supabase";
import {
  isAdmin,
  setAdminSession,
  clearAdminSession,
  verifyAdminPassword,
} from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

async function loadDashboard(supabase: ReturnType<typeof createServiceClient>) {
  const { data: parties } = await supabase
    .from("parties")
    .select(
      "id, party_name, guests(id, first_name, last_name, is_attending, meal_choice, dietary_notes)",
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
    if (!partyName) {
      return fail(400, { error: "Party name is required." });
    }

    const supabase = createServiceClient(env);
    const { error } = await supabase.from("parties").insert({ party_name: partyName });
    if (error) {
      if (error.code === "23505") {
        return fail(400, {
          error:
            "A party with that name already exists. Add a last initial or similar to tell them apart (e.g. \"The Smiths - J\").",
        });
      }
      return fail(500, { error: "Could not create party." });
    }

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
};
