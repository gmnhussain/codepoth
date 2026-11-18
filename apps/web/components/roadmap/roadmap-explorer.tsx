"use client"

import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { MinusIcon, PlusIcon, SearchIcon } from "lucide-react"

import { formatNumber, formatTwoDigits } from "@workspace/config/format"
import type { Roadmap, RoadmapTopic } from "@workspace/content/roadmap"
import { isTopicVisible } from "@workspace/content/roadmap"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Progress, ProgressLabel } from "@workspace/ui/components/progress"
import { Sheet, SheetTitle } from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

import { AppSheetContent } from "@/components/app-sheet"
import { ProgressCount } from "@/components/lesson/progress-count"
import { RoadmapCanvas } from "@/components/roadmap/roadmap-canvas"
import { RoadmapPanel } from "@/components/roadmap/roadmap-panel"
import { ROADMAP_STATE_LABEL } from "@/components/roadmap/state-label"
import { StationDot } from "@/components/station-dot"
import { useT } from "@/lib/labels-context"
import {
  ROADMAP_FILTERS,
  passesRoadmapFilter,
  roadmapFilterOf,
} from "@/lib/progress/roadmap-filter"
import type { RoadmapFilter } from "@/lib/progress/roadmap-filter"
import { summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"
import { useMediaQuery } from "@/lib/use-media-query"
import { useUrlParam, writeUrlParams } from "@/lib/url-state"

/** Zoom steps, 50–120 % (design.md, Roadmap page); the map opens at 80 %. */
const ZOOMS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2] as const
const DEFAULT_ZOOM = 3
/** Padding around the drawing inside the scroll box (px-10 pt-28). */
const PAD_X = 40
const PAD_TOP = 112
/** The side panel and the legend column appear from `md`. */
const DESKTOP = "(min-width: 48rem)"

/**
 * URL parameters: /roadmap?topic=frontend/react&track=frontend&q=…
 * &filter=start|done|reading|todo
 */
const PARAM = {
  topic: "topic",
  track: "track",
  query: "q",
  filter: "filter",
} as const

const FILTER_LABEL = {
  all: "roadmap.filterAll",
  start: "roadmap.filterStart",
  done: ROADMAP_STATE_LABEL.done,
  reading: ROADMAP_STATE_LABEL["in-progress"],
  todo: ROADMAP_STATE_LABEL["not-started"],
} as const satisfies Record<
  RoadmapFilter,
  `roadmap.${string}` | `status.${string}`
>

/** Every lesson of a topic, groups first, in order. */
function lessonIdsOf(topic: RoadmapTopic): string[] {
  return [
    ...topic.groups.flatMap((group) => group.lessons.map((item) => item.id)),
    ...topic.lessons.map((item) => item.id),
  ]
}

const PILL =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border bg-card px-3.5 text-sm font-medium whitespace-nowrap text-foreground/80 hover:border-foreground/30 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"

/**
 * The roadmap's interactive parts: track focus, start-only filter, topic
 * search, zoom and the topic panel, with the state in the URL
 * (conventions §10). The drawing itself is `RoadmapCanvas`.
 */
export function RoadmapExplorer({
  roadmap,
  title,
  summary,
}: {
  readonly roadmap: Roadmap
  readonly title: string
  readonly summary: string
}) {
  // "topic" and "status" for the canvas, which gets this `t`.
  const t = useT(["roadmap", "lesson", "topic", "status"])
  const searchId = useId()
  const isDesktop = useMediaQuery(DESKTOP)
  const scroller = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  /**
   * Where focus goes once the next selection change is committed: the
   * panel's heading after a pick, the topic's dot after closing. Applied in
   * a layout effect, so it never races the panel's mount or unmount.
   */
  const pendingFocus = useRef<
    { readonly to: "panel" } | { readonly to: "dot"; readonly key: string }
  >(undefined)

  /**
   * Whether the map is centred on the next topic selected. True at first, so
   * a shared ?topic= link opens centred; a pick on the map itself turns it
   * off (that dot is already in view).
   */
  const centerNext = useRef(true)

  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const scale = ZOOMS[zoom] ?? 1

  // Selection, track focus, search and filter live only in the URL; unknown
  // values in a shared link are ignored.
  const topicByKey = useMemo(
    () => new Map(roadmap.topics.map((item) => [item.key, item])),
    [roadmap]
  )
  const topicParam = useUrlParam(PARAM.topic)
  const trackParam = useUrlParam(PARAM.track)
  const query = useUrlParam(PARAM.query)
  const statusFilter = roadmapFilterOf(useUrlParam(PARAM.filter))
  const selectedTopic = topicByKey.get(topicParam)
  const selected = selectedTopic?.key
  const track = roadmap.tracks.some((item) => item.id === trackParam)
    ? trackParam
    : undefined

  // The reader's state per topic, from its lessons (ADR-0014).
  const progress = useProgress()
  const lessonIdsByKey = useMemo(
    () => new Map(roadmap.topics.map((item) => [item.key, lessonIdsOf(item)])),
    [roadmap]
  )
  const stateOf = (topic: RoadmapTopic) =>
    summarize(progress, lessonIdsByKey.get(topic.key) ?? []).state
  const ownLessonIds = (trackId: string) =>
    roadmap.topics
      .filter((item) => item.track === trackId)
      .flatMap((item) => lessonIdsByKey.get(item.key) ?? [])
  const allLessonIds = roadmap.topics.flatMap(
    (item) => lessonIdsByKey.get(item.key) ?? []
  )
  const overall = summarize(progress, allLessonIds)

  const filter = { track, startOnly: statusFilter === "start", query }
  const isVisible = (topic: RoadmapTopic) =>
    isTopicVisible(topic, filter) &&
    passesRoadmapFilter(statusFilter, topic, stateOf(topic))
  const isFiltering = statusFilter !== "all" || query.trim() !== ""
  const matched = roadmap.topics.filter(isVisible).length

  const select = (
    key: string | undefined,
    options: { center?: boolean; focusPanel?: boolean } = {}
  ) => {
    pendingFocus.current =
      options.focusPanel === true ? { to: "panel" } : undefined
    centerNext.current = options.center === true
    writeUrlParams({ [PARAM.topic]: key })
  }

  /** Closes the panel and puts focus back on the topic's dot. */
  const closePanel = () => {
    const key = selected
    select(undefined)
    if (key !== undefined) pendingFocus.current = { to: "dot", key }
  }

  const focusTrack = (id: string | undefined) => {
    writeUrlParams({ [PARAM.track]: id })
  }

  // After the commit that selects a topic: centre the map on it if asked
  // (a pick from the panel, or a shared link on load).
  useLayoutEffect(() => {
    if (selected === undefined || !centerNext.current) return
    centerNext.current = false
    const topic = topicByKey.get(selected)
    const box = scroller.current
    if (topic === undefined || box === null) return
    box.scrollTo({
      left: topic.x * scale + PAD_X - box.clientWidth / 2,
      top: topic.y * scale + PAD_TOP - box.clientHeight / 2,
    })
  }, [selected, scale, topicByKey])

  // Right after the commit that opens or closes the panel: move focus to
  // the panel's heading (desktop; the sheet manages its own focus) or back
  // to the topic's dot.
  useLayoutEffect(() => {
    const target = pendingFocus.current
    if (target === undefined) return
    if (target.to === "panel") {
      if (selected === undefined || !isDesktop) return
      pendingFocus.current = undefined
      headingRef.current?.focus()
      return
    }
    if (selected !== undefined) return
    pendingFocus.current = undefined
    document
      .querySelector<HTMLButtonElement>(
        `[data-topic="${CSS.escape(target.key)}"]`
      )
      ?.focus()
  }, [selected, isDesktop])

  const panel =
    selectedTopic === undefined ? null : (
      <RoadmapPanel
        roadmap={roadmap}
        topic={selectedTopic}
        onSelect={(key) => {
          select(key, { center: true, focusPanel: true })
        }}
        onClose={isDesktop ? closePanel : undefined}
        headingRef={headingRef}
      />
    )

  return (
    <div className="flex flex-col border-b md:h-205 md:flex-row">
      <aside
        aria-labelledby="roadmap-title"
        className="flex shrink-0 flex-col gap-3.5 px-4 pt-6 pb-3 md:w-75 md:overflow-y-auto md:border-e md:py-5"
      >
        <div className="flex flex-col gap-1 md:px-2">
          <h1 id="roadmap-title" className="text-3xl font-semibold">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </div>
        {/* In the first-visit HTML too (zero done), so nothing appears or
            moves once progress is read. */}
        <div className="flex flex-col gap-2 rounded-xl bg-muted px-3.5 py-3 md:mx-2">
          <Progress
            value={
              overall.total === 0
                ? 0
                : Math.round((overall.done / overall.total) * 100)
            }
            getAriaValueText={() =>
              t("roadmap.progress", {
                total: overall.total,
                done: overall.done,
              })
            }
            className="gap-2 [&_[data-slot=progress-indicator]]:bg-foreground [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-card"
          >
            <ProgressLabel className="flex-1 text-sm font-normal text-foreground/80">
              {t("roadmap.yourProgress")}
            </ProgressLabel>
            <span
              aria-hidden="true"
              className="grid justify-items-end font-mono text-sm text-foreground/80"
            >
              <span className="invisible col-start-1 row-start-1">
                {formatNumber(overall.total)}/{formatNumber(overall.total)}
              </span>
              <span className="col-start-1 row-start-1">
                {formatNumber(overall.done)}/{formatNumber(overall.total)}
              </span>
            </span>
          </Progress>
          <p className="text-xs leading-snug text-muted-foreground">
            {t("roadmap.savedNote")}
          </p>
        </div>
        <div className="hidden min-h-11 items-center justify-between px-2 md:flex">
          <span className="text-sm font-semibold text-muted-foreground">
            {t("roadmap.trackCount", { n: roadmap.tracks.length })}
          </span>
          {track === undefined ? null : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                focusTrack(undefined)
              }}
            >
              {t("roadmap.showAllTracks")}
            </Button>
          )}
        </div>
        <ul
          aria-label={t("roadmap.pickTrack")}
          className="hidden flex-col gap-0.5 md:flex"
        >
          {roadmap.tracks.map((item) => {
            const ids = ownLessonIds(item.id)
            const trackSummary = summarize(progress, ids)
            const percent =
              trackSummary.total === 0
                ? 0
                : Math.round((trackSummary.done / trackSummary.total) * 100)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-track-color={item.color}
                  aria-pressed={track === item.id}
                  onClick={() => {
                    focusTrack(track === item.id ? undefined : item.id)
                  }}
                  className="flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-start hover:bg-muted aria-pressed:border-border aria-pressed:bg-card"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 h-7.5 w-1.5 shrink-0 rounded-full bg-track-dot"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="leading-snug font-semibold">
                        {item.titleEn}
                      </span>
                      {ids.length > 0 ? (
                        <ProgressCount lessonIds={ids} />
                      ) : null}
                    </span>
                    <span className="text-sm leading-snug text-muted-foreground">
                      {t("roadmap.trackNumber", {
                        n: formatTwoDigits(item.number),
                      })}
                      <span aria-hidden="true"> · </span>
                      {item.title}
                    </span>
                    {ids.length > 0 ? (
                      <span
                        aria-hidden="true"
                        className="block h-0.75 rounded-full bg-muted"
                      >
                        <span
                          className="block h-full rounded-full bg-track-dot"
                          // The share is data; its colour stays a token class.
                          style={{ width: `${String(percent)}%` }}
                        />
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <div
        role="group"
        aria-label={t("roadmap.pickTrack")}
        className="flex gap-2 overflow-x-auto border-b px-4 py-3 md:hidden"
      >
        <button
          type="button"
          aria-pressed={track === undefined}
          onClick={() => {
            focusTrack(undefined)
          }}
          className={PILL}
        >
          {t("roadmap.allTracks")}
        </button>
        {roadmap.tracks.map((item) => (
          <button
            key={item.id}
            type="button"
            data-track-color={item.color}
            aria-pressed={track === item.id}
            onClick={() => {
              focusTrack(track === item.id ? undefined : item.id)
            }}
            className={PILL}
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-track-dot"
            />
            {item.titleEn}
          </button>
        ))}
      </div>

      <div className="relative h-140 min-w-0 overflow-hidden md:h-auto md:flex-1">
        <div ref={scroller} className="absolute inset-0 overflow-auto">
          <div className="w-max px-10 pt-28 pb-24">
            <div
              style={{
                width: roadmap.width * scale,
                height: roadmap.height * scale,
              }}
            >
              <RoadmapCanvas
                t={t}
                roadmap={roadmap}
                scale={scale}
                isVisible={isVisible}
                selectedKey={selected}
                focusedTrack={track}
                onSelect={(key) => {
                  select(key, { focusPanel: true })
                }}
                stateOf={stateOf}
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t("roadmap.filterLabel")}
            className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-full border bg-card p-1"
          >
            {ROADMAP_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={statusFilter === item}
                onClick={() => {
                  writeUrlParams({
                    [PARAM.filter]: item === "all" ? undefined : item,
                  })
                }}
                className={cn(PILL, "border-transparent")}
              >
                {t(FILTER_LABEL[item])}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto relative flex items-center">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute start-3.5 size-4 text-muted-foreground"
            />
            <label htmlFor={searchId} className="sr-only">
              {t("roadmap.searchLabel")}
            </label>
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => {
                writeUrlParams({ [PARAM.query]: event.target.value })
              }}
              placeholder={t("roadmap.searchPlaceholder")}
              className="h-12 w-64 bg-card ps-10"
            />
          </div>
          <p role="status" className="sr-only">
            {isFiltering
              ? matched === 0
                ? t("roadmap.noMatch")
                : t("roadmap.matched", { n: matched })
              : ""}
          </p>
        </div>

        <div
          role="group"
          aria-label={t("roadmap.zoom")}
          className="absolute start-4 bottom-4 flex items-center gap-1 rounded-full border bg-card p-1"
        >
          <Button
            variant="ghost"
            size="icon"
            disabled={zoom === 0}
            onClick={() => {
              setZoom((value) => Math.max(0, value - 1))
            }}
          >
            <MinusIcon aria-hidden="true" />
            <span className="sr-only">{t("roadmap.zoomOut")}</span>
          </Button>
          <span className="min-w-12 text-center font-mono text-sm text-foreground/80">
            {t("roadmap.zoomLevel", {
              n: formatNumber(Math.round(scale * 100)),
            })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={zoom === ZOOMS.length - 1}
            onClick={() => {
              setZoom((value) => Math.min(ZOOMS.length - 1, value + 1))
            }}
          >
            <PlusIcon aria-hidden="true" />
            <span className="sr-only">{t("roadmap.zoomIn")}</span>
          </Button>
        </div>

        {/* The marks' key; each dot button's name already says its state. */}
        <div
          aria-hidden="true"
          className="absolute start-48 bottom-4 hidden min-h-11 items-center gap-4 rounded-full border bg-card px-4 text-sm text-foreground/80 lg:flex"
        >
          {(["done", "in-progress", "not-started"] as const).map((state) => (
            <span key={state} className="inline-flex items-center gap-2">
              <StationDot state={state} className="size-3.5 border-3" />
              {t(ROADMAP_STATE_LABEL[state])}
            </span>
          ))}
          <span className="inline-flex items-center gap-2">
            <span className="size-4 rounded-full border-4 border-foreground" />
            {t("lesson.interchange")}
          </span>
        </div>

        {isDesktop && panel !== null ? (
          <div className="pointer-events-none absolute inset-4 flex justify-end">
            <aside
              aria-label={selectedTopic?.title}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === "Escape") closePanel()
              }}
              className="pointer-events-auto w-full max-w-100 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg"
            >
              {panel}
            </aside>
          </div>
        ) : null}
      </div>

      <Sheet
        open={!isDesktop && panel !== null}
        onOpenChange={(open) => {
          if (!open) closePanel()
        }}
      >
        <AppSheetContent
          side="bottom"
          className="max-h-3/4 overflow-y-auto rounded-t-2xl px-5 pt-14 pb-6"
        >
          <SheetTitle className="sr-only">{selectedTopic?.title}</SheetTitle>
          {panel}
        </AppSheetContent>
      </Sheet>
    </div>
  )
}
