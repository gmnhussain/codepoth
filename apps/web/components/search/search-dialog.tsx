"use client"

import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import {
  RESULT_SELECTOR,
  SearchResults,
} from "@/components/search/search-results"
import { useT } from "@/lib/labels-context"
import {
  getPagefind,
  loadPagefind,
  usePagefindStatus,
} from "@/lib/search/pagefind.client"
import type { SearchRow } from "@/lib/search/results"
import { searchQueryOf, searchRows } from "@/lib/search/search-rows.client"
import { useIsApple } from "@/lib/search/use-is-apple"

const KBD =
  "rounded-md border border-foreground/20 bg-muted px-1.5 font-mono text-xs text-foreground/80"

const LINK =
  "font-semibold text-foreground underline underline-offset-4 hover:no-underline"

/** How long the reader pauses typing before a search runs. */
const SEARCH_DELAY_MS = 200

/** Rows with the query they answer, so stale rows are known as stale. */
type Answer = { readonly query: string; readonly rows: readonly SearchRow[] }

/**
 * The site search (ADR-0015): a field near the top of the screen, so a
 * growing list below never moves it. Loaded with its module on the first
 * open; Pagefind loads when it opens. Base UI's dialog traps focus, closes
 * on Escape and returns focus to where it was. ↓ moves from the field into
 * the results, ↑/↓ between them, and ↑ from the first back to the field.
 */
export function SearchDialog({
  open,
  onOpenChange,
  fieldId,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** The field's id, so the shortcut can focus it while the dialog is open. */
  readonly fieldId: string
}) {
  const t = useT(["search"])
  const isApple = useIsApple()
  const status = usePagefindStatus()
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState<Answer | undefined>(undefined)
  const field = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const searchQuery = searchQueryOf(query)
  const hasQuery = searchQuery !== ""

  useEffect(() => {
    if (open) loadPagefind()
  }, [open])

  // Search once typing pauses; a newer query cancels the older one.
  useEffect(() => {
    const pagefind = getPagefind()
    if (status !== "ready" || pagefind === undefined || searchQuery === "") {
      return
    }
    let isCurrent = true
    const timer = setTimeout(() => {
      searchRows(pagefind, searchQuery).then(
        (rows) => {
          if (isCurrent) setAnswer({ query: searchQuery, rows })
        },
        () => {
          if (isCurrent) setAnswer({ query: searchQuery, rows: [] })
        }
      )
    }, SEARCH_DELAY_MS)
    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [searchQuery, status])

  const close = () => {
    onOpenChange(false)
  }

  const resultLinks = () => [
    ...(list.current?.querySelectorAll<HTMLElement>(RESULT_SELECTOR) ?? []),
  ]

  const onFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowDown") return
    const first = resultLinks()[0]
    if (first === undefined) return
    event.preventDefault()
    first.focus()
  }

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    const links = resultLinks()
    const index = links.findIndex((link) => link === document.activeElement)
    if (index === -1) return
    event.preventDefault()
    if (event.key === "ArrowDown") {
      links[index + 1]?.focus()
    } else if (index === 0) {
      field.current?.focus()
    } else {
      links[index - 1]?.focus()
    }
  }

  const shown = hasQuery && status === "ready" ? answer : undefined
  const isStale = shown !== undefined && shown.query !== searchQuery
  const contentsUrl = `/contents?q=${encodeURIComponent(searchQuery)}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        initialFocus={field}
        className="top-4 flex max-h-[calc(100svh-2rem)] translate-y-0 flex-col gap-0 rounded-2xl p-3 sm:top-24 sm:max-h-[calc(100svh-8rem)] sm:max-w-[620px] motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
      >
        <DialogTitle className="sr-only">{t("search.dialog")}</DialogTitle>
        <div className="flex items-center gap-2 border-b pb-2.5 pl-2">
          <SearchIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
          <label htmlFor={fieldId} className="sr-only">
            {t("search.field")}
          </label>
          <input
            ref={field}
            id={fieldId}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            onKeyDown={onFieldKeyDown}
            placeholder={t("search.placeholder")}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-1.5 text-lg outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <DialogClose
            render={<Button variant="ghost" size="icon" />}
            aria-label={t("search.close")}
          >
            <kbd aria-hidden="true" className={KBD}>
              {t("search.escKey")}
            </kbd>
          </DialogClose>
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-1 pt-1.5 pb-1 text-sm leading-reading text-foreground/80">
          {/* Present from the start, so what it says later is announced. */}
          <div role="status" className="flex flex-col gap-2 px-2">
            {status === "unavailable" ? (
              <>
                <p className="font-semibold text-foreground">
                  {t("search.unavailable")}
                </p>
                <p>{t("search.unavailableHint")}</p>
                <p>
                  <Link href="/contents" onClick={close} className={LINK}>
                    {t("search.toContents")}
                  </Link>
                </p>
              </>
            ) : hasQuery && status === "loading" ? (
              <p>{t("search.loading")}</p>
            ) : shown === undefined ? null : shown.rows.length > 0 ? (
              <p className="text-muted-foreground">
                {t("search.results", { n: shown.rows.length })}
              </p>
            ) : (
              <>
                <p className="font-semibold text-foreground">
                  {t("search.noResults", { query: shown.query })}
                </p>
                <p>{t("search.noResultsHint")}</p>
                <p>
                  {/* A plain link: the contents page reads ?q= on load,
                      also when it is the page already open. */}
                  <a href={contentsUrl} onClick={close} className={LINK}>
                    {t("search.searchContents")}
                  </a>
                </p>
              </>
            )}
          </div>
          {shown !== undefined && shown.rows.length > 0 ? (
            <SearchResults
              rows={shown.rows}
              isStale={isStale}
              listRef={list}
              onNavigate={close}
              onKeyDown={onListKeyDown}
            />
          ) : null}
          {!hasQuery && status !== "unavailable" ? (
            <div className="flex flex-col gap-2 px-2">
              <p>{t("search.hint")}</p>
              <p className="text-muted-foreground">
                {t("search.shortcutHint", {
                  key: isApple ? t("search.keyApple") : t("search.keyOther"),
                })}
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
