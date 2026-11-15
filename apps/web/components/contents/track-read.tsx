"use client"

import { useT } from "@/lib/labels-context"
import { summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * A track's "{done}/{total} পড়া" with a thin bar in the track colour, in
 * the track's summary row. Fixed width, so the row never reflows as the
 * numbers change; part of the summary's name.
 */
export function TrackRead({
  lessonIds,
}: {
  readonly lessonIds: readonly string[]
}) {
  const t = useT(["contents"])
  const { done, total } = summarize(useProgress(), lessonIds)
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <span className="flex w-20 shrink-0 flex-col items-end gap-1 sm:w-32">
      <span className="font-mono text-xs text-foreground/80">
        {t("contents.trackRead", { done, total })}
      </span>
      <span aria-hidden="true" className="h-1.5 w-full rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-track-dot"
          // The share is data; its colour stays a token class.
          style={{ width: `${String(percent)}%` }}
        />
      </span>
    </span>
  )
}
