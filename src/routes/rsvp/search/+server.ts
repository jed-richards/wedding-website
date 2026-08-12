import { json } from "@sveltejs/kit";
import { createServiceClient } from "$lib/server/supabase";
import { loadPartyDirectory } from "$lib/server/partyDirectory";
import { searchParties } from "$lib/partySearch";
import type { RequestHandler } from "./$types";

/** Live autocomplete for the RSVP name gate. Returns display names only —
 * never party ids — and nothing at all for very short queries, so this
 * can't be used to enumerate the guest list one keystroke at a time. */
export const GET: RequestHandler = async ({ url, platform }) => {
  const query = url.searchParams.get("q") ?? "";
  if (query.trim().length < 2) {
    return json({ results: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const supabase = createServiceClient(platform!.env);
  const parties = await loadPartyDirectory(supabase);
  const matches = searchParties(query, parties);

  return json(
    { results: matches.map((party) => ({ display_name: party.display_name })) },
    { headers: { "Cache-Control": "no-store" } },
  );
};
