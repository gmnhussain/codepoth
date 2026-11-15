/**
 * What a search result says about its page, written into the page for
 * Pagefind at build time and read back by the search dialog (ADR-0015).
 */

/** The kinds of indexed page; the glossary page's results are its terms. */
export const SEARCH_KINDS = ["lesson", "topic", "glossary", "page"] as const

export type SearchKind = (typeof SEARCH_KINDS)[number]

/** A page's search details: its kind, and where it sits on the roadmap. */
export type SearchMeta = {
  readonly kind: SearchKind
  /** The track's display name. */
  readonly track?: string
  /** The topic's title (lessons only). */
  readonly topic?: string
  /** The track's colour name, for the result's dot. */
  readonly hue?: string
}
