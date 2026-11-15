import type { PagefindApi } from "@/lib/search/pagefind.client"
import type { SearchRow } from "@/lib/search/results"
import {
  MAX_ROWS,
  mergeResults,
  rowsFromPages,
  toResultPage,
} from "@/lib/search/results"
import { normalizeSearchText } from "@/lib/search/search-text"
import { trimmedQuery } from "@/lib/search/trim-suffixes"

/** A Pagefind result before its data is fetched. */
type PendingResult = {
  readonly id: string
  readonly data: () => Promise<unknown>
}

/** The results of a `search()` call, or none if it is not that shape. */
function resultsOf(response: unknown): PendingResult[] {
  if (typeof response !== "object" || response === null) return []
  const results = (response as { results?: unknown }).results
  if (!Array.isArray(results)) return []
  return results.filter(
    (result: unknown): result is PendingResult =>
      typeof result === "object" &&
      result !== null &&
      typeof (result as { id?: unknown }).id === "string" &&
      typeof (result as { data?: unknown }).data === "function"
  )
}

/** The query as the index stores text (ADR-0015), trimmed. */
export function searchQueryOf(query: string): string {
  return normalizeSearchText(query).trim()
}

/**
 * The dialog's rows for a query. The reader's own query and, when a word
 * has a Bangla ending, the trimmed query run side by side; the trimmed
 * one only adds results (ADR-0015). Data is fetched only for the pages
 * that can become rows.
 */
export async function searchRows(
  pagefind: PagefindApi,
  query: string
): Promise<SearchRow[]> {
  const own = searchQueryOf(query)
  if (own === "") return []
  const trimmed = trimmedQuery(own)
  const [ownResults, extraResults] = await Promise.all([
    pagefind.search(own).then(resultsOf),
    trimmed === undefined
      ? Promise.resolve([])
      : pagefind.search(trimmed).then(resultsOf),
  ])
  const results = mergeResults(ownResults, extraResults).slice(0, MAX_ROWS)
  const pages = await Promise.all(results.map((result) => result.data()))
  return rowsFromPages(
    pages.flatMap((data) => {
      const page = toResultPage(data)
      return page === undefined ? [] : [page]
    })
  )
}
