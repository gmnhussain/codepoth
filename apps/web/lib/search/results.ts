import type { SearchKind } from "@/lib/search/search-meta"
import { SEARCH_KINDS } from "@/lib/search/search-meta"

/** One row in the search dialog. */
export type SearchRow = {
  /** Unique within a result list (the URL, with its anchor for terms). */
  readonly key: string
  readonly url: string
  readonly title: string
  readonly kind: SearchKind
  readonly track?: string
  readonly topic?: string
  readonly hue?: string
}

/** A section of a result page that matched (Pagefind's sub-result). */
type SubResult = { readonly url: string; readonly title: string }

/** The parts of a Pagefind result's data the dialog reads. */
export type ResultPage = {
  readonly url: string
  readonly meta: Readonly<Record<string, string>>
  readonly subResults: readonly SubResult[]
}

/** At most this many rows in the dialog. */
export const MAX_ROWS = 10

/**
 * At most this many glossary terms per query, so one match in the
 * glossary's many cards cannot fill the list.
 */
export const MAX_TERMS = 5

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  )
}

/**
 * Pagefind's result data, checked: `undefined` if it is not the shape the
 * dialog reads. Sub-results without a URL or title are dropped.
 */
export function toResultPage(data: unknown): ResultPage | undefined {
  if (!isRecord(data) || typeof data.url !== "string") return undefined
  const subs = Array.isArray(data.sub_results) ? data.sub_results : []
  return {
    url: data.url,
    meta: stringRecord(data.meta),
    subResults: subs.flatMap((sub: unknown) =>
      isRecord(sub) &&
      typeof sub.url === "string" &&
      typeof sub.title === "string"
        ? [{ url: sub.url, title: sub.title }]
        : []
    ),
  }
}

function kindOf(meta: Readonly<Record<string, string>>): SearchKind {
  return SEARCH_KINDS.find((kind) => kind === meta.kind) ?? "page"
}

/**
 * The rows for result pages, in their order. A glossary page becomes one
 * row per matching term (its sub-results with an anchor), at most
 * `MAX_TERMS`; every other page is one row, however many of its sections
 * matched, so one lesson cannot fill the list. At most `MAX_ROWS` rows.
 */
export function rowsFromPages(pages: readonly ResultPage[]): SearchRow[] {
  const rows: SearchRow[] = []
  for (const page of pages) {
    const kind = kindOf(page.meta)
    if (kind === "glossary") {
      const terms = page.subResults.filter((sub) => sub.url.includes("#"))
      for (const term of terms.slice(0, MAX_TERMS)) {
        rows.push({ key: term.url, url: term.url, title: term.title, kind })
      }
    } else {
      const { title, track, topic, hue } = page.meta
      rows.push({
        key: page.url,
        url: page.url,
        title: title ?? page.url,
        kind,
        ...(track === undefined ? {} : { track }),
        ...(topic === undefined ? {} : { topic }),
        ...(hue === undefined ? {} : { hue }),
      })
    }
  }
  return rows.slice(0, MAX_ROWS)
}

/**
 * The reader's own results first, then those only the trimmed query found
 * (ADR-0015); each result once, by its id.
 */
export function mergeResults<T extends { readonly id: string }>(
  own: readonly T[],
  extra: readonly T[]
): T[] {
  const seen = new Set(own.map((result) => result.id))
  return [...own, ...extra.filter((result) => !seen.has(result.id))]
}
