/**
 * Text matching for the on-page filters (Contents now, Glossary later).
 * Kept free of other imports so client islands can use it cheaply.
 */

/** Text in the form both sides of a match use: NFC, lower case, single spaces. */
export function normalizeForSearch(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim()
}

/**
 * A lesson's searchable text on the contents page: its title, its group's
 * title (if any) and its topic's title, normalised.
 */
export function lessonSearchText(
  lessonTitle: string,
  groupTitle: string | undefined,
  topicTitle: string
): string {
  return normalizeForSearch(
    [lessonTitle, groupTitle, topicTitle]
      .filter((part) => part !== undefined)
      .join(" ")
  )
}

/**
 * Whether every word of `query` appears in `haystack` (already normalised).
 * An empty query matches everything.
 */
export function matchesQuery(haystack: string, query: string): boolean {
  const words = normalizeForSearch(query).split(" ").filter(Boolean)
  return words.every((word) => haystack.includes(word))
}
