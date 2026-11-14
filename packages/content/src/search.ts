/**
 * Text matching for the on-page filters (Contents now, Glossary later).
 * Kept free of other imports so client islands can use it cheaply.
 */

/** Text in the form both sides of a match use: NFC, lower case, single spaces. */
export function normalizeForSearch(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim()
}

/**
 * Whether every word of `query` appears in `haystack` (already normalised).
 * An empty query matches everything.
 */
export function matchesQuery(haystack: string, query: string): boolean {
  const words = normalizeForSearch(query).split(" ").filter(Boolean)
  return words.every((word) => haystack.includes(word))
}
