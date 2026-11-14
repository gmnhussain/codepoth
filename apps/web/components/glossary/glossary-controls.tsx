"use client"

import { useEffect, useId, useRef } from "react"
import { SearchIcon } from "lucide-react"

import { formatNumber } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { matchesQuery } from "@workspace/content/search"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { useUrlParam, writeUrlParams } from "@/lib/url-state"

/** URL parameters: /glossary?q=token&letter=T */
const PARAM = { query: "q", letter: "letter" } as const

const LETTER_BUTTON =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg px-2 font-mono text-sm hover:bg-muted disabled:cursor-default disabled:text-muted-foreground/50 disabled:hover:bg-transparent aria-pressed:bg-foreground aria-pressed:text-background"

/** Whether a term passes the letter (if any) and the query. */
function passes(
  term: { readonly letter: string; readonly search: string },
  letter: string | undefined,
  query: string
): boolean {
  return (
    (letter === undefined || term.letter === letter) &&
    matchesQuery(term.search, query)
  )
}

/**
 * Search and the A–Z filter for the glossary. The term cards are
 * server-rendered (term-card.tsx); this island only sets `hidden` on cards
 * and letter sections. The query and letter live only in the URL
 * (`?q=&letter=`).
 */
export function GlossaryControls({
  rootId,
  terms,
  letters,
}: {
  readonly rootId: string
  /** Every term's letter and searchable text, as on its card. */
  readonly terms: readonly {
    readonly letter: string
    readonly search: string
  }[]
  /** Every letter on the bar with its term count (0 = disabled). */
  readonly letters: readonly {
    readonly letter: string
    readonly count: number
  }[]
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const query = useUrlParam(PARAM.query)
  const letterParam = useUrlParam(PARAM.letter)
  // An unknown or empty letter in the URL is ignored.
  const letter = letters.some(
    (item) => item.letter === letterParam && item.count > 0
  )
    ? letterParam
    : undefined
  const total = terms.length
  const isFiltering = query.trim() !== "" || letter !== undefined
  const matched = terms.filter((term) => passes(term, letter, query)).length

  // Show the cards that match both the query and the letter.
  useEffect(() => {
    const root = document.getElementById(rootId)
    if (root === null) return
    for (const card of root.querySelectorAll<HTMLElement>("[data-term]")) {
      card.hidden = !passes(
        {
          letter: card.dataset.letter ?? "",
          search: card.dataset.search ?? "",
        },
        letter,
        query
      )
    }
    for (const section of root.querySelectorAll<HTMLElement>(
      "[data-letter-section]"
    )) {
      section.hidden =
        section.querySelector("[data-term]:not([hidden])") === null
    }
  }, [letter, query, rootId])

  const setLetter = (next: string | undefined) => {
    writeUrlParams({ [PARAM.letter]: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3.5">
        <div className="relative flex items-center">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute start-4 size-4 text-muted-foreground"
          />
          <label htmlFor={inputId} className="sr-only">
            {t("glossary.searchLabel")}
          </label>
          <Input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => {
              writeUrlParams({ [PARAM.query]: event.target.value })
            }}
            placeholder={t("glossary.searchPlaceholder")}
            className="h-12 bg-background ps-11 pe-24"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute end-4 font-mono text-xs text-muted-foreground"
          >
            {isFiltering
              ? t("glossary.countMatched", {
                  n: formatNumber(matched),
                  total: formatNumber(total),
                })
              : t("glossary.count", { n: total })}
          </span>
        </div>
        <nav
          aria-label={t("glossary.letterNav")}
          className="flex flex-wrap gap-0.5"
        >
          <button
            type="button"
            aria-pressed={letter === undefined}
            onClick={() => {
              setLetter(undefined)
            }}
            className={`${LETTER_BUTTON} px-3 font-sans`}
          >
            {t("glossary.allLetters")}
          </button>
          {letters.map((item) => (
            <button
              key={item.letter}
              type="button"
              disabled={item.count === 0}
              aria-pressed={letter === item.letter}
              aria-label={
                item.count === 0
                  ? t("glossary.letterNone", { letter: item.letter })
                  : t("glossary.letterHas", {
                      letter: item.letter,
                      n: item.count,
                    })
              }
              onClick={() => {
                setLetter(letter === item.letter ? undefined : item.letter)
              }}
              className={LETTER_BUTTON}
            >
              {item.letter}
            </button>
          ))}
        </nav>
      </div>
      <p role="status" className="sr-only">
        {isFiltering
          ? matched === 0
            ? t("glossary.noResults")
            : t("glossary.matched", { n: matched })
          : ""}
      </p>
      {isFiltering && matched === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center">
          <p className="font-heading text-2xl font-semibold">
            {t("glossary.noResults")}
          </p>
          <p className="text-foreground/80">{t("glossary.noResultsHint")}</p>
          <Button
            variant="outline"
            onClick={() => {
              writeUrlParams({
                [PARAM.query]: undefined,
                [PARAM.letter]: undefined,
              })
              inputRef.current?.focus()
            }}
          >
            {t("glossary.showAll")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
