import { describe, expect, it } from "vitest";
import { normalizeName, resolveParty, searchParties } from "./partySearch";

// Fixtures drawn from the real shapes in data/parties.json: an opaque
// party_name handle (printed on the lost/missing invitation card) paired
// with the guest's actual display_name.
const parties = [
  { party_name: "yrichards", display_name: "Yvette Richards" },
  { party_name: "wiegand", display_name: "Cheyenne and Jesse Wiegand" },
  { party_name: "edoty", display_name: "Kim and Eric Doty" },
  { party_name: "Sugar Magnolia", display_name: "Todd Richards" },
  {
    party_name: "trichards",
    display_name: "Todd Richards II and Alina Robles",
  },
  { party_name: "kenadie", display_name: "Kenadie Torres" },
];

describe("normalizeName", () => {
  it("lowercases, strips accents and punctuation, collapses whitespace", () => {
    expect(normalizeName("  José   O'Brien! ")).toBe("jose o brien");
  });

  it("treats & as and", () => {
    expect(normalizeName("Jack & Jill")).toBe("jack and jill");
  });

  it("handles non-string input", () => {
    expect(normalizeName(undefined)).toBe("");
    expect(normalizeName(null)).toBe("");
  });
});

describe("searchParties", () => {
  it("still matches the old printed handle exactly", () => {
    const results = searchParties("yrichards", parties);
    expect(results[0].display_name).toBe("Yvette Richards");
  });

  it("matches the handle with spaces", () => {
    const results = searchParties("Sugar Magnolia", parties);
    expect(results[0].display_name).toBe("Todd Richards");
  });

  it("matches on first name only", () => {
    const results = searchParties("cheyenne", parties);
    expect(results[0].display_name).toBe("Cheyenne and Jesse Wiegand");
  });

  it("matches on last name only", () => {
    const results = searchParties("wiegand", parties);
    expect(results[0].display_name).toBe("Cheyenne and Jesse Wiegand");
  });

  it("matches the second person named in a party", () => {
    const results = searchParties("jesse", parties);
    expect(results[0].display_name).toBe("Cheyenne and Jesse Wiegand");
  });

  it("matches a full first+last name", () => {
    const results = searchParties("Kim Doty", parties);
    expect(results[0].display_name).toBe("Kim and Eric Doty");
  });

  it("tolerates a one-letter typo", () => {
    const results = searchParties("kenady", parties);
    expect(results[0].display_name).toBe("Kenadie Torres");
  });

  it("tolerates a typo in a longer surname", () => {
    const results = searchParties("wiegend", parties);
    expect(results[0].display_name).toBe("Cheyenne and Jesse Wiegand");
  });

  it("is case, punctuation, and accent insensitive", () => {
    const results = searchParties("  YVETTE   richards!! ", parties);
    expect(results[0].display_name).toBe("Yvette Richards");
  });

  it("treats & the same as and", () => {
    const results = searchParties("Cheyenne & Jesse", parties);
    expect(results[0].display_name).toBe("Cheyenne and Jesse Wiegand");
  });

  it("ranks multiple parties sharing a surname, without dropping either", () => {
    const results = searchParties("richards", parties);
    const names = results.map((p) => p.display_name);
    expect(names).toContain("Yvette Richards");
    expect(names).toContain("Todd Richards");
    expect(names).toContain("Todd Richards II and Alina Robles");
  });

  it("does not treat % or _ as SQL wildcards", () => {
    expect(searchParties("%", parties)).toEqual([]);
    expect(searchParties("_", parties)).toEqual([]);
  });

  it("returns nothing for a blank query", () => {
    expect(searchParties("", parties)).toEqual([]);
    expect(searchParties("   ", parties)).toEqual([]);
  });

  it("caps results at the given limit", () => {
    const results = searchParties("richards", parties, 2);
    expect(results.length).toBe(2);
  });
});

describe("resolveParty", () => {
  it("resolves an exact display_name match even if fuzzy search would find others", () => {
    const result = resolveParty("Todd Richards", parties);
    expect(result).toEqual({ kind: "exact", party: parties[3] });
  });

  it("resolves an exact printed-handle match", () => {
    const result = resolveParty("yrichards", parties);
    expect(result.kind).toBe("exact");
    if (result.kind === "exact") {
      expect(result.party.display_name).toBe("Yvette Richards");
    }
  });

  it("resolves a fuzzy query that narrows to exactly one party", () => {
    const result = resolveParty("kenady", parties);
    expect(result.kind).toBe("exact");
    if (result.kind === "exact") {
      expect(result.party.display_name).toBe("Kenadie Torres");
    }
  });

  it("reports ambiguous rather than guessing among a shared surname", () => {
    const result = resolveParty("richards", parties);
    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(result.matches.length).toBeGreaterThan(1);
    }
  });

  it("reports none for a query with no match", () => {
    expect(resolveParty("nobody here", parties)).toEqual({ kind: "none" });
  });

  it("reports none for a blank query", () => {
    expect(resolveParty("", parties)).toEqual({ kind: "none" });
  });
});
