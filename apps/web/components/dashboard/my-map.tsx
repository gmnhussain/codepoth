"use client"

import Link from "next/link"

import { formatNumber } from "@workspace/config/format"

import type { MapPreviewData } from "@/components/home/roadmap-preview"
import { RoadmapPreview } from "@/components/home/roadmap-preview"
import { STATE_LABEL } from "@/components/lesson/state-label"
import { StationDot } from "@/components/station-dot"
import { useT } from "@/lib/labels-context"
import type { Progress } from "@/lib/progress/progress.schema"
import { LESSON_STATES, summarize } from "@/lib/progress/selectors"

/**
 * "আমার ম্যাপ": the whole roadmap with the reader's state on every topic,
 * faded where nothing is read yet, linking to the roadmap; a key below
 * counts the topics in each state.
 */
export function MyMap({
  progress,
  map,
  topics,
}: {
  readonly progress: Progress
  readonly map: MapPreviewData
  readonly topics: Readonly<Record<string, readonly string[]>>
}) {
  const t = useT(["dashboard", "status"])
  const stateOf = (key: string) =>
    Object.hasOwn(topics, key)
      ? summarize(progress, topics[key] ?? []).state
      : "not-started"
  const counts = Object.fromEntries(
    LESSON_STATES.map((state) => [
      state,
      Object.keys(topics).filter((key) => stateOf(key) === state).length,
    ])
  )

  return (
    <section
      aria-labelledby="map-heading"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="map-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          {t("dashboard.myMap")}
        </h2>
        <p className="text-sm text-foreground/80">{t("dashboard.myMapHint")}</p>
      </div>
      <Link
        href="/roadmap"
        aria-label={t("dashboard.myMapLink")}
        className="block rounded-xl border bg-background p-3 hover:border-foreground/30"
      >
        <RoadmapPreview roadmap={map} stateOf={stateOf} />
      </Link>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/80">
        {(["done", "in-progress", "not-started"] as const).map((state) => (
          <li key={state} className="inline-flex items-center gap-2">
            <StationDot state={state} className="size-3.5 border-3" />
            {t(STATE_LABEL[state])}
            <span className="font-mono text-xs text-muted-foreground">
              {formatNumber(counts[state] ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
