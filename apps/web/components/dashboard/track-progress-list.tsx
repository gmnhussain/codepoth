"use client"

import type { TrackColor } from "@workspace/config/track-colors"
import { formatNumber } from "@workspace/config/format"

import { useT } from "@/lib/labels-context"
import type { Progress } from "@/lib/progress/progress.schema"
import { summarize } from "@/lib/progress/selectors"

/** "লাইনভিত্তিক অগ্রগতি": each track's lessons done, with a bar in its colour. */
export function TrackProgressList({
  progress,
  tracks,
}: {
  readonly progress: Progress
  readonly tracks: readonly {
    readonly id: string
    readonly title: string
    readonly color: TrackColor
    readonly lessonIds: readonly string[]
  }[]
}) {
  const t = useT(["dashboard"])
  return (
    <section
      aria-labelledby="tracks-heading"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="tracks-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          {t("dashboard.perTrack")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("dashboard.perTrackHint")}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {tracks
          .filter((track) => track.lessonIds.length > 0)
          .map((track) => {
            const { done, total } = summarize(progress, track.lessonIds)
            const percent = Math.round((done / total) * 100)
            return (
              <li
                key={track.id}
                data-track-color={track.color}
                className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full bg-track-dot"
                  />
                  <span className="truncate">{track.title}</span>
                </span>
                <span
                  role="img"
                  aria-label={t("dashboard.trackProgress", {
                    track: track.title,
                    total,
                    done,
                  })}
                  className="h-2 rounded-full bg-muted"
                >
                  <span
                    className="block h-full rounded-full bg-track-dot"
                    // The share is data; its colour stays a token class.
                    style={{ width: `${String(percent)}%` }}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="font-mono text-xs text-muted-foreground"
                >
                  {formatNumber(done)}/{formatNumber(total)}
                </span>
              </li>
            )
          })}
      </ul>
    </section>
  )
}
