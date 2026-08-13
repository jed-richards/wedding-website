import { describe, expect, it } from "vitest";
import {
  filterParties,
  partyStatus,
  type PartyRow,
  relativeTime,
  sortParties,
  summarize,
} from "./admin";

function party(overrides: Partial<PartyRow> = {}): PartyRow {
  return {
    id: "1",
    party_name: "Smith",
    display_name: "The Smiths",
    max_party_size: 2,
    plus_ones: 0,
    attending_count: null,
    dietary_notes: null,
    phone: null,
    updated_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("partyStatus", () => {
  it("treats a null attending_count as awaiting", () => {
    expect(partyStatus(party({ attending_count: null }))).toBe("awaiting");
  });

  it("treats an explicit 0 as declined, not awaiting", () => {
    expect(partyStatus(party({ attending_count: 0 }))).toBe("declined");
  });

  it("treats any positive count as attending", () => {
    expect(partyStatus(party({ attending_count: 3 }))).toBe("attending");
  });
});

describe("summarize", () => {
  it("sums seats by status against max_party_size, not attending_count", () => {
    const parties = [
      party({ max_party_size: 4, attending_count: 2 }), // 2 didn't come, still reserved
      party({ max_party_size: 1, attending_count: 0 }),
      party({ max_party_size: 3, attending_count: null }),
    ];
    const summary = summarize(parties);
    expect(summary.totalSeats).toBe(8);
    expect(summary.seatsAttending).toBe(4);
    expect(summary.seatsDeclined).toBe(1);
    expect(summary.seatsAwaiting).toBe(3);
    expect(summary.partiesAttending).toBe(1);
    expect(summary.partiesDeclined).toBe(1);
    expect(summary.partiesAwaiting).toBe(1);
    expect(summary.responded).toBe(2);
    expect(summary.responseRate).toBeCloseTo(2 / 3);
  });

  it("counts parties with a phone number", () => {
    const parties = [party({ phone: "+14025551234" }), party({ phone: null })];
    expect(summarize(parties).withPhone).toBe(1);
  });

  it("returns a zero response rate for an empty list", () => {
    expect(summarize([]).responseRate).toBe(0);
  });
});

describe("filterParties", () => {
  const parties = [
    party({
      id: "1",
      party_name: "Smith",
      display_name: "The Smiths",
      phone: "+14025551234",
      attending_count: 2,
    }),
    party({
      id: "2",
      party_name: "Jones",
      display_name: "The Joneses",
      phone: null,
      attending_count: null,
    }),
  ];

  it("matches on display name case-insensitively", () => {
    const result = filterParties(parties, { query: "smiths", status: "all" });
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("matches a bare-digit phone search against a formatted number", () => {
    const result = filterParties(parties, { query: "4025551234", status: "all" });
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });

  it("filters by status", () => {
    const result = filterParties(parties, { query: "", status: "awaiting" });
    expect(result.map((p) => p.id)).toEqual(["2"]);
  });

  it("combines query and status", () => {
    const result = filterParties(parties, { query: "smith", status: "attending" });
    expect(result.map((p) => p.id)).toEqual(["1"]);
    expect(filterParties(parties, { query: "smith", status: "declined" })).toEqual([]);
  });
});

describe("sortParties", () => {
  const parties = [
    party({
      id: "1",
      display_name: "Zeta",
      max_party_size: 1,
      updated_at: "2026-01-01T00:00:00Z",
    }),
    party({
      id: "2",
      display_name: "Alpha",
      max_party_size: 5,
      updated_at: "2026-03-01T00:00:00Z",
    }),
  ];

  it("sorts by name without mutating the input", () => {
    const original = [...parties];
    const result = sortParties(parties, "name");
    expect(result.map((p) => p.id)).toEqual(["2", "1"]);
    expect(parties).toEqual(original);
  });

  it("sorts by size descending", () => {
    expect(sortParties(parties, "size").map((p) => p.id)).toEqual(["2", "1"]);
  });

  it("sorts by most recently updated first", () => {
    expect(sortParties(parties, "recent").map((p) => p.id)).toEqual(["2", "1"]);
  });

  it("sorts by status, awaiting first", () => {
    const mixed = [
      party({ id: "attending", attending_count: 1 }),
      party({ id: "awaiting", attending_count: null }),
      party({ id: "declined", attending_count: 0 }),
    ];
    expect(sortParties(mixed, "status").map((p) => p.id)).toEqual([
      "awaiting",
      "attending",
      "declined",
    ]);
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-01-10T12:00:00Z").getTime();

  it("reports very recent times as just now", () => {
    expect(relativeTime("2026-01-10T11:59:45Z", now)).toBe("just now");
  });

  it("reports minutes ago", () => {
    expect(relativeTime("2026-01-10T11:45:00Z", now)).toBe("15m ago");
  });

  it("reports hours ago", () => {
    expect(relativeTime("2026-01-10T09:00:00Z", now)).toBe("3h ago");
  });

  it("reports days ago", () => {
    expect(relativeTime("2026-01-07T12:00:00Z", now)).toBe("3d ago");
  });

  it("falls back to a plain date past a month", () => {
    expect(relativeTime("2025-11-01T12:00:00Z", now)).toBe(
      new Date("2025-11-01T12:00:00Z").toLocaleDateString(),
    );
  });
});
