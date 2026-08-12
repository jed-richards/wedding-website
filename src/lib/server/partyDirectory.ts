import type { createServiceClient } from "./supabase";

export type DirectoryParty = {
  id: string;
  party_name: string;
  display_name: string;
};

const TTL_MS = 60_000;

let cache: { expiresAt: number; parties: DirectoryParty[] } | null = null;

/** Loads every party's id/party_name/display_name for the RSVP name-search
 * gate. Cached in module scope for a short TTL — 71 parties is a trivial
 * payload, but a debounced autocomplete can fire several requests a second
 * per visitor, and there's no reason each keystroke should hit Supabase. */
export async function loadPartyDirectory(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<DirectoryParty[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.parties;
  }

  const { data, error } = await supabase
    .from("parties")
    .select("id, party_name, display_name");
  if (error || !data) {
    return cache?.parties ?? [];
  }

  cache = { expiresAt: Date.now() + TTL_MS, parties: data };
  return data;
}
