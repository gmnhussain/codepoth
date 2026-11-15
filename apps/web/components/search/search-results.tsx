"use client"

import type { KeyboardEventHandler, Ref } from "react"
import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import type { SearchRow } from "@/lib/search/results"
import type { SearchKind } from "@/lib/search/search-meta"

/** The result links, which the dialog's arrow keys move between. */
export const RESULT_SELECTOR = "[data-search-result]"

const KIND_LABEL = {
  lesson: "search.kindLesson",
  topic: "search.kindTopic",
  glossary: "search.kindGlossary",
  page: "search.kindPage",
} as const satisfies Record<SearchKind, `search.${string}`>

const ROW =
  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"

function ResultContent({ row }: { readonly row: SearchRow }) {
  const t = useT(["search"])
  const place = [row.track, row.topic].filter(
    (part): part is string => part !== undefined
  )
  return (
    <>
      <span
        aria-hidden="true"
        data-track-color={row.hue}
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          row.hue === undefined ? "bg-foreground/30" : "bg-track-dot"
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold text-foreground">{row.title}</span>
        {place.length > 0 ? (
          <span className="text-sm text-muted-foreground">
            {place.map((part, index) => (
              <span key={part}>
                {index > 0 ? (
                  <>
                    {/* "·" on screen, a comma for screen readers. */}
                    <span aria-hidden="true"> · </span>
                    <span className="sr-only">, </span>
                  </>
                ) : null}
                {part}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {t(KIND_LABEL[row.kind])}
      </span>
    </>
  )
}

/**
 * The result rows: track dot, title, where it sits (track · topic) and its
 * kind. A link to a glossary card is a plain `<a>`, so `:target` updates
 * (docs/design.md); every other result is a client-side `Link` without
 * prefetching.
 */
export function SearchResults({
  rows,
  isStale,
  listRef,
  onNavigate,
  onKeyDown,
}: {
  readonly rows: readonly SearchRow[]
  /** The rows belong to an earlier query; the next ones are on their way. */
  readonly isStale: boolean
  readonly listRef: Ref<HTMLUListElement>
  readonly onNavigate: () => void
  readonly onKeyDown: KeyboardEventHandler<HTMLUListElement>
}) {
  const t = useT(["search"])
  return (
    <ul
      ref={listRef}
      aria-label={t("search.resultsLabel")}
      onKeyDown={onKeyDown}
      className={cn("flex flex-col gap-0.5", isStale && "opacity-60")}
    >
      {rows.map((row) => (
        <li key={row.key}>
          {row.url.includes("#") ? (
            <a
              href={row.url}
              data-search-result=""
              onClick={onNavigate}
              className={ROW}
            >
              <ResultContent row={row} />
            </a>
          ) : (
            <Link
              href={row.url}
              // A list of up to ten results changes with every query; the
              // reader opens one, so none is fetched ahead.
              prefetch={false}
              data-search-result=""
              onClick={onNavigate}
              className={ROW}
            >
              <ResultContent row={row} />
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}
