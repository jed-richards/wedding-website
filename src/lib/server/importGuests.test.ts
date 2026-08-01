import { describe, expect, it } from "vitest";
import { MAX_PARTY_SIZE, parseImport } from "./importGuests";

function partyFixture(overrides: Record<string, unknown> = {}) {
  return {
    party_name: "The Smiths",
    guests: [{ first_name: "Jed", last_name: "Richards" }],
    ...overrides,
  };
}

describe("parseImport", () => {
  it("defaults max_party_size to the named guest count when omitted", () => {
    const result = parseImport(JSON.stringify([partyFixture()]));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parties[0].maxPartySize).toBe(1);
    }
  });

  it("accepts an explicit max_party_size that allows plus-ones", () => {
    const result = parseImport(JSON.stringify([partyFixture({ max_party_size: 2 })]));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parties[0].maxPartySize).toBe(2);
    }
  });

  it("rejects a max_party_size smaller than the named guest count", () => {
    const result = parseImport(
      JSON.stringify([
        partyFixture({
          guests: [
            { first_name: "Jed", last_name: "Richards" },
            { first_name: "Kenadie", last_name: "Doty" },
          ],
          max_party_size: 1,
        }),
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/max_party_size/);
    }
  });

  it("rejects a non-integer max_party_size", () => {
    const result = parseImport(JSON.stringify([partyFixture({ max_party_size: 1.5 })]));
    expect(result.ok).toBe(false);
  });

  it("rejects a max_party_size above the sane cap", () => {
    const result = parseImport(
      JSON.stringify([partyFixture({ max_party_size: MAX_PARTY_SIZE + 1 })]),
    );
    expect(result.ok).toBe(false);
  });
});
