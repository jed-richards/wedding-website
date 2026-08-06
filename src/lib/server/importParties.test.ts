import { describe, expect, it } from "vitest";
import { MAX_PARTY_SIZE, parseImport } from "./importParties";

function partyFixture(overrides: Record<string, unknown> = {}) {
  return {
    party_name: "The Smiths",
    ...overrides,
  };
}

describe("parseImport", () => {
  it("defaults display_name, max_party_size, and plus_ones when omitted", () => {
    const result = parseImport(JSON.stringify([partyFixture()]));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parties[0]).toEqual({
        partyName: "The Smiths",
        displayName: "The Smiths",
        maxPartySize: 1,
        plusOnes: 0,
      });
    }
  });

  it("accepts explicit display_name, max_party_size, and plus_ones", () => {
    const result = parseImport(
      JSON.stringify([
        partyFixture({
          display_name: "Kyle & Sara",
          max_party_size: 3,
          plus_ones: 1,
        }),
      ]),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parties[0]).toEqual({
        partyName: "The Smiths",
        displayName: "Kyle & Sara",
        maxPartySize: 3,
        plusOnes: 1,
      });
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

  it("rejects plus_ones greater than max_party_size", () => {
    const result = parseImport(
      JSON.stringify([partyFixture({ max_party_size: 2, plus_ones: 3 })]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/plus_ones/);
    }
  });

  it("rejects duplicate party names within the same file", () => {
    const result = parseImport(
      JSON.stringify([
        partyFixture({ party_name: "The Smiths" }),
        partyFixture({ party_name: "the smiths" }),
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/duplicate party name/);
    }
  });
});
