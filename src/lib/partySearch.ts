/** Pure name-matching logic for the RSVP lookup, kept free of any Supabase or
 * request dependencies (mirrors phone.ts) so the matching rules are easy to
 * reason about and unit-test in isolation.
 *
 * Invitations carry a printed `party_name` (an opaque handle like
 * "yrichards" or "digdoug"), but guests naturally try to look themselves up
 * by their actual name — `display_name` (e.g. "Yvette Richards"). This module
 * searches both fields, tolerating typos, partial names, and either half of
 * a two-person party name, so a guest without the printed card can still
 * find themselves. */

export type SearchableParty = {
  party_name: string;
  display_name: string;
};

export type ResolveResult<T> =
  { kind: "exact"; party: T } | { kind: "ambiguous"; matches: T[] } | { kind: "none" };

const STOPWORDS = new Set(["and", "the"]);

/** Normalizes a name/query for comparison: strips accents, lowercases,
 * treats "&" as "and", drops punctuation, and collapses whitespace. Applied
 * identically to stored names and to what a guest types, so e.g. "Jose",
 * "José", "JOSE", and "jose" all line up. */
export function normalizeName(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(normalized: string): string[] {
  return normalized.split(" ").filter((t) => t && !STOPWORDS.has(t));
}

/** Bounded Levenshtein distance: returns a value > max as soon as it's clear
 * the true distance exceeds max, without finishing the full DP table. */
function levenshteinWithin(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      );
      curr.push(value);
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1; // whole row exceeds budget, bail out
    prev = curr;
  }
  return prev[b.length];
}

/** Typo budget scaled to word length: short words tolerate a 1-character
 * slip, longer words tolerate 2. */
function typoBudget(token: string): number {
  return token.length <= 4 ? 1 : 2;
}

/** Best-match score of a single normalized field against the query tokens.
 * Returns 0 if the field doesn't match every query token in some form. */
function scoreField(fieldNormalized: string, queryTokens: string[]): number {
  if (!fieldNormalized) return 0;

  const fieldTokens = tokenize(fieldNormalized);
  if (fieldTokens.length === 0) return 0;

  let total = 0;
  for (const qToken of queryTokens) {
    let best = 0;
    for (const fToken of fieldTokens) {
      if (fToken === qToken) {
        best = Math.max(best, 100);
      } else if (fToken.startsWith(qToken)) {
        best = Math.max(best, 70 * (qToken.length / fToken.length));
      } else if (fToken.includes(qToken) && qToken.length >= 3) {
        best = Math.max(best, 40);
      } else {
        const budget = typoBudget(qToken);
        const dist = levenshteinWithin(qToken, fToken, budget);
        if (dist <= budget && qToken.length >= 3) {
          best = Math.max(best, 30 - dist * 10);
        }
      }
    }
    if (best === 0) return 0; // every query token must match something
    total += best;
  }

  return total;
}

/** Searches a party list for the given free-text query, matching against
 * both `display_name` and `party_name`, and returns the best matches ranked
 * by relevance (highest score first, alphabetical by display_name to break
 * ties), capped at `limit`. */
export function searchParties<T extends SearchableParty>(
  query: string,
  parties: T[],
  limit = 8,
): T[] {
  const normalizedQuery = normalizeName(query);
  const queryTokens = tokenize(normalizedQuery);
  if (queryTokens.length === 0) return [];

  const scored = parties
    .map((party) => {
      const displayScore = scoreField(normalizeName(party.display_name), queryTokens);
      const handleScore = scoreField(normalizeName(party.party_name), queryTokens);
      return { party, score: Math.max(displayScore, handleScore) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.party.display_name.localeCompare(b.party.display_name);
    });

  return scored.slice(0, limit).map(({ party }) => party);
}

/** Resolves a single query to exactly one party where possible:
 * - an exact (post-normalization) match on either name field always wins
 *   outright, even if fuzzy search would also surface other candidates;
 * - otherwise, a fuzzy search that narrows to exactly one candidate counts
 *   as resolved;
 * - multiple fuzzy candidates come back as "ambiguous" so the caller can
 *   show a pick list instead of guessing;
 * - no candidates come back as "none". */
export function resolveParty<T extends SearchableParty>(
  query: string,
  parties: T[],
): ResolveResult<T> {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return { kind: "none" };

  const exact = parties.find(
    (party) =>
      normalizeName(party.display_name) === normalizedQuery ||
      normalizeName(party.party_name) === normalizedQuery,
  );
  if (exact) return { kind: "exact", party: exact };

  const matches = searchParties(query, parties);
  if (matches.length === 0) return { kind: "none" };
  if (matches.length === 1) return { kind: "exact", party: matches[0] };
  return { kind: "ambiguous", matches };
}
