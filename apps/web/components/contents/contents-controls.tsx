"use client"

import { useEffect, useId, useRef } from "react"
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  SearchIcon,
} from "lucide-react"

import { formatNumber } from "@workspace/config/format"
import { matchesQuery } from "@workspace/content/search"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { useT } from "@/lib/labels-context"
import {
  STATUS_FILTERS,
  passesStatus,
  statusCounts,
  statusFilterOf,
} from "@/lib/progress/status-filter"
import type { StatusFilter } from "@/lib/progress/status-filter"
import { useProgress } from "@/lib/progress-store.client"
import { useUrlParam, writeUrlParams } from "@/lib/url-state"

/** The search query's URL parameter: /contents?q=… */
const QUERY_PARAM = "q"
/** The status filter's URL parameter: /contents?status=todo|done (none: all). */
const STATUS_PARAM = "status"

const FILTER_LABEL = {
  all: "contents.filterAll",
  todo: "contents.filterTodo",
  done: "contents.filterDone",
} as const satisfies Record<StatusFilter, `contents.${string}`>

const LESSON = "[data-lesson-search]"
const CONTAINERS = [
  "[data-filter-group]",
  "[data-filter-topic]",
  "[data-filter-track]",
] as const

/**
 * Opens the track a `#track-…` link points at (jump links, "পাঠগুলো … →").
 * The target sits inside the track's `<details>`, which browsers with
 * "ancestor details revealing" open themselves (even without JavaScript).
 * This is the fallback for browsers that do not: it runs everywhere, does
 * nothing when the track is already open, and otherwise opens it and
 * scrolls, since the hidden target could not be scrolled to.
 */
function openHashTarget() {
  const id = decodeURIComponent(window.location.hash.slice(1))
  if (id === "") return
  const target = document.getElementById(id)
  const details = target?.closest("details")
  if (!(details instanceof HTMLDetailsElement) || details.open) return
  details.open = true
  target?.scrollIntoView()
}

/**
 * Search, the status filter (সব / বাকি / পড়া শেষ), open-all/close-all and
 * hash handling for the contents page. The list itself is server-rendered
 * (track-section.tsx); this island only sets `hidden` and `open` on it, so
 * the page works without JS as plain `<details>`. Query and filter live only
 * in the URL (`?q=`, `?status=`); the filter reads the reader's progress.
 */
export function ContentsControls({
  rootId,
  lessons,
}: {
  readonly rootId: string
  /** Every lesson's id and searchable text (its `data-lesson-*` values). */
  readonly lessons: readonly {
    readonly id: string
    readonly searchText: string
  }[]
}) {
  const t = useT(["contents"])
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const progress = useProgress()
  const query = useUrlParam(QUERY_PARAM)
  const status = statusFilterOf(useUrlParam(STATUS_PARAM))
  const hasQuery = query.trim() !== ""
  const isFiltering = hasQuery || status !== "all"
  const counts = statusCounts(
    progress,
    lessons.map((lesson) => lesson.id)
  )
  const matched = isFiltering
    ? lessons.filter(
        (lesson) =>
          (!hasQuery || matchesQuery(lesson.searchText, query)) &&
          passesStatus(progress, lesson.id, status)
      ).length
    : undefined
  // Open state before filtering, restored when query and filter are cleared.
  const savedOpen = useRef<Map<HTMLDetailsElement, boolean> | undefined>(
    undefined
  )

  // Show only matching lessons (and their groups, topics, tracks), opened.
  useEffect(() => {
    const root = document.getElementById(rootId)
    if (root === null) return
    const details = [...root.querySelectorAll("details")]
    const isQuery = query.trim() !== ""

    if (!isQuery && status === "all") {
      for (const element of root.querySelectorAll<HTMLElement>("[hidden]")) {
        element.hidden = false
      }
      if (savedOpen.current !== undefined) {
        for (const [element, open] of savedOpen.current) element.open = open
        savedOpen.current = undefined
      }
      return
    }

    savedOpen.current ??= new Map(
      details.map((element) => [element, element.open])
    )
    for (const lesson of root.querySelectorAll<HTMLElement>(LESSON)) {
      lesson.hidden = !(
        (!isQuery || matchesQuery(lesson.dataset.lessonSearch ?? "", query)) &&
        passesStatus(progress, lesson.dataset.lessonId ?? "", status)
      )
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
  }, [query, status, progress, rootId])

  // Open a #track-… target on load and on in-page links. In a browser that
  // already revealed it, the track is open and this does nothing.
  useEffect(() => {
    openHashTarget()
    window.addEventListener("hashchange", openHashTarget)
    return () => {
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
        <div
          role="group"
          aria-label={t("contents.filterLabel")}
          className="flex flex-wrap gap-2"
        >
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter}
              variant={status === filter ? "default" : "outline"}
              aria-pressed={status === filter}
              onClick={() => {
                writeUrlParams({
                  [STATUS_PARAM]: filter === "all" ? undefined : filter,
                })
              }}
            >
              {t(FILTER_LABEL[filter])}
              {/* The count sits in a box as wide as the largest it can be,
                  so it never changes the button's width (ADR-0014). */}
              <span className="grid justify-items-start text-xs tabular-nums opacity-80">
                <span
                  aria-hidden="true"
                  className="invisible col-start-1 row-start-1"
                >
                  {formatNumber(lessons.length)}
                </span>
                <span className="col-start-1 row-start-1">
                  {formatNumber(counts[filter])}
                </span>
              </span>
            </Button>
          ))}
        </div>
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
              writeUrlParams({ [QUERY_PARAM]: event.target.value })
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
              writeUrlParams({
                [QUERY_PARAM]: undefined,
                [STATUS_PARAM]: undefined,
              })
              inputRef.current?.focus()
            }}
          >
            {t("contents.clearFilters")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
