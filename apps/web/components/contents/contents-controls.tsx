"use client"

import { useEffect, useEffectEvent, useId, useRef, useState } from "react"
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  SearchIcon,
} from "lucide-react"

import { t } from "@workspace/config/t"
import { matchesQuery } from "@workspace/content/search"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { readUrlParam, writeUrlParams } from "@/lib/url-state"

/** The search query's URL parameter: /contents?q=… */
const QUERY_PARAM = "q"

const LESSON = "[data-lesson-search]"
const CONTAINERS = [
  "[data-filter-group]",
  "[data-filter-topic]",
  "[data-filter-track]",
] as const

/** Opens the track section a `#track-…` link points at (jump links, "পাঠগুলো … →"). */
function openHashTarget() {
  const id = decodeURIComponent(window.location.hash.slice(1))
  if (id === "") return
  const details = document.getElementById(id)?.querySelector("details")
  if (details instanceof HTMLDetailsElement) details.open = true
}

/**
 * Search, open-all/close-all and hash handling for the contents page. The
 * list itself is server-rendered (track-section.tsx); this island only sets
 * `hidden` and `open` on it, so the page works without JS as plain
 * `<details>`.
 */
export function ContentsControls({ rootId }: { readonly rootId: string }) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [matched, setMatched] = useState<number | undefined>(undefined)
  // Open state before a search, restored when the query is cleared.
  const savedOpen = useRef<Map<HTMLDetailsElement, boolean> | undefined>(
    undefined
  )

  /**
   * Shows only matching lessons (and their groups, topics, tracks), opened,
   * and keeps the query in `?q=` so a search can be shared.
   */
  const applyQuery = (next: string) => {
    setQuery(next)
    writeUrlParams({ [QUERY_PARAM]: next })
    const root = document.getElementById(rootId)
    if (root === null) return
    const details = [...root.querySelectorAll("details")]

    if (next.trim() === "") {
      for (const element of root.querySelectorAll<HTMLElement>("[hidden]")) {
        element.hidden = false
      }
      if (savedOpen.current !== undefined) {
        for (const [element, open] of savedOpen.current) element.open = open
        savedOpen.current = undefined
      }
      setMatched(undefined)
      return
    }

    savedOpen.current ??= new Map(
      details.map((element) => [element, element.open])
    )
    let count = 0
    for (const lesson of root.querySelectorAll<HTMLElement>(LESSON)) {
      const hit = matchesQuery(lesson.dataset.lessonSearch ?? "", next)
      lesson.hidden = !hit
      if (hit) count += 1
    }
    for (const element of root.querySelectorAll<HTMLElement>(
      "[data-filter-referenced]"
    )) {
      element.hidden = true
    }
    // Innermost first, so a topic sees its groups' final state.
    for (const selector of CONTAINERS) {
      for (const element of root.querySelectorAll<HTMLElement>(selector)) {
        element.hidden =
          element.querySelector(`${LESSON}:not([hidden])`) === null
      }
    }
    for (const element of details) element.open = true
    setMatched(count)
  }

  // On load: apply a shared ?q=, then open a #track-… target.
  const onMount = useEffectEvent(() => {
    const initial = readUrlParam(QUERY_PARAM)
    if (initial.trim() !== "") applyQuery(initial)
    openHashTarget()
  })

  useEffect(() => {
    // The URL is an external source; read it in a callback after hydration
    // rather than setting state synchronously in the effect body.
    const frame = window.requestAnimationFrame(onMount)
    window.addEventListener("hashchange", openHashTarget)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("hashchange", openHashTarget)
    }
  }, [])

  const setAllOpen = (open: boolean) => {
    const root = document.getElementById(rootId)
    if (root === null) return
    for (const element of root.querySelectorAll("details")) element.open = open
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
        <div className="relative flex min-w-64 flex-1 items-center">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute start-3.5 size-4 text-muted-foreground"
          />
          <label htmlFor={inputId} className="sr-only">
            {t("contents.searchLabel")}
          </label>
          <Input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => {
              applyQuery(event.target.value)
            }}
            placeholder={t("contents.searchPlaceholder")}
            className="h-11 bg-background ps-10"
          />
        </div>
        <div
          role="group"
          aria-label={t("contents.expandLabel")}
          className="flex gap-2"
        >
          <Button
            variant="outline"
            onClick={() => {
              setAllOpen(true)
            }}
          >
            <ChevronsUpDownIcon aria-hidden="true" />
            {t("contents.openAll")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setAllOpen(false)
            }}
          >
            <ChevronsDownUpIcon aria-hidden="true" />
            {t("contents.closeAll")}
          </Button>
        </div>
      </div>
      <p role="status" className="min-h-6 text-sm text-muted-foreground">
        {matched === undefined ? null : matched === 0 ? (
          // Announced here; shown in the card below.
          <span className="sr-only">{t("contents.noResults")}</span>
        ) : (
          t("contents.matched", { n: matched })
        )}
      </p>
      {matched === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center">
          <p className="font-heading text-2xl font-semibold">
            {t("contents.noResults")}
          </p>
          <p className="text-foreground/80">{t("contents.noResultsHint")}</p>
          <Button
            variant="outline"
            onClick={() => {
              applyQuery("")
              inputRef.current?.focus()
            }}
          >
            {t("contents.clearSearch")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
