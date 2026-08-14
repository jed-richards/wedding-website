/** Pure helpers for the /admin dashboard — status classification, summary math,
 * search, and sorting — kept free of any Supabase or Svelte dependency so the
 * rules are easy to reason about and unit-test in isolation (mirrors
 * phone.ts and server/importParties.ts). */

/** The row shape selected by `loadDashboard()` in `admin/+page.server.ts`. */
export interface PartyRow {
  id: string;
  party_name: string;
  display_name: string;
  max_party_size: number;
  plus_ones: number;
  attending_count: number | null;
  dietary_notes: string | null;
  phone: string | null;
  updated_at: string;
  created_at: string;
}

export type PartyStatus = "attending" | "declined" | "awaiting";

/** A party's RSVP state: no response yet, responded with zero attending, or
 * responded with at least one. `attending_count === null` is the "hasn't
 * touched the form" case — distinct from an explicit 0 (declined). */
export function partyStatus(party: Pick<PartyRow, "attending_count">): PartyStatus {
  if (party.attending_count === null) return "awaiting";
  if (party.attending_count === 0) return "declined";
  return "attending";
}

export interface Summary {
  totalSeats: number;
  seatsAttending: number;
  seatsUnclaimed: number;
  seatsDeclined: number;
  seatsAwaiting: number;
  partiesAttending: number;
  partiesUnclaimed: number;
  partiesDeclined: number;
  partiesAwaiting: number;
  responded: number;
  noResponse: number;
  withPhone: number;
  /** Fraction of parties that have responded, 0–1 (0 when there are no parties). */
  responseRate: number;
}

/** Aggregates the party list into the counts the dashboard's summary card and
 * seat ledger need. Seats are counted against `max_party_size` (the reserved
 * seat count), except for attending parties: a seat only counts as
 * `seatsAttending` if a person actually claimed it (`attending_count`); the
 * rest of that party's reservation counts as `seatsUnclaimed` — reserved,
 * RSVP'd, but not coming. */
export function summarize(parties: PartyRow[]): Summary {
  let seatsAttending = 0;
  let seatsUnclaimed = 0;
  let seatsDeclined = 0;
  let seatsAwaiting = 0;
  let partiesAttending = 0;
  let partiesUnclaimed = 0;
  let partiesDeclined = 0;
  let partiesAwaiting = 0;
  let withPhone = 0;

  for (const party of parties) {
    const status = partyStatus(party);
    if (status === "attending") {
      const attending = party.attending_count ?? 0;
      const unclaimed = party.max_party_size - attending;
      seatsAttending += attending;
      seatsUnclaimed += unclaimed;
      partiesAttending++;
      if (unclaimed > 0) partiesUnclaimed++;
    } else if (status === "declined") {
      seatsDeclined += party.max_party_size;
      partiesDeclined++;
    } else {
      seatsAwaiting += party.max_party_size;
      partiesAwaiting++;
    }
    if (party.phone !== null) withPhone++;
  }

  const responded = partiesAttending + partiesDeclined;
  return {
    totalSeats: seatsAttending + seatsUnclaimed + seatsDeclined + seatsAwaiting,
    seatsAttending,
    seatsUnclaimed,
    seatsDeclined,
    seatsAwaiting,
    partiesAttending,
    partiesUnclaimed,
    partiesDeclined,
    partiesAwaiting,
    responded,
    noResponse: partiesAwaiting,
    withPhone,
    responseRate: parties.length === 0 ? 0 : responded / parties.length,
  };
}

export interface PartyFilter {
  query: string;
  status: PartyStatus | "all";
}

/** Case-insensitive search across party name, display name, and phone. Phone
 * matching compares digits only, so a bare "4025551234" search matches a
 * formatted "(402) 555-1234" number. */
export function filterParties(parties: PartyRow[], filter: PartyFilter): PartyRow[] {
  const query = filter.query.trim().toLowerCase();
  const queryDigits = query.replace(/[^0-9]/g, "");

  return parties.filter((party) => {
    if (filter.status !== "all" && partyStatus(party) !== filter.status) return false;
    if (!query) return true;

    const nameMatch =
      party.party_name.toLowerCase().includes(query) ||
      party.display_name.toLowerCase().includes(query);
    if (nameMatch) return true;

    if (queryDigits && party.phone) {
      return party.phone.replace(/[^0-9]/g, "").includes(queryDigits);
    }
    return false;
  });
}

export type SortKey = "name" | "size" | "recent" | "status";

const STATUS_ORDER: Record<PartyStatus, number> = {
  awaiting: 0,
  attending: 1,
  declined: 2,
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Formats an ISO timestamp as a short relative string ("just now", "3h ago",
 * "5d ago"), falling back to a plain date past a month. `now` is injectable
 * for testing; defaults to the current time. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Sorts a copy of `parties`; never mutates the input. */
export function sortParties(parties: PartyRow[], key: SortKey): PartyRow[] {
  const sorted = [...parties];
  switch (key) {
    case "name":
      sorted.sort((a, b) => a.display_name.localeCompare(b.display_name));
      break;
    case "size":
      sorted.sort((a, b) => b.max_party_size - a.max_party_size);
      break;
    case "recent":
      sorted.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      break;
    case "status":
      sorted.sort(
        (a, b) => STATUS_ORDER[partyStatus(a)] - STATUS_ORDER[partyStatus(b)],
      );
      break;
  }
  return sorted;
}
