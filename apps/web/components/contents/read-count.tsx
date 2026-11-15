"use client"

import { formatNumber } from "@workspace/config/format"

import { summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * How many of these lessons the reader has finished, for the header's
 * "তুমি পড়েছ" stat. Its box is as wide as the total from the first render,
 * so the stats row never reflows (ADR-0014).
 */
export function ReadCount({
  lessonIds,
}: {
  readonly lessonIds: readonly string[]
}) {
  const { done, total } = summarize(useProgress(), lessonIds)
  return (
    <span className="grid justify-items-start tabular-nums">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {formatNumber(total)}
      </span>
      <span className="col-start-1 row-start-1">{formatNumber(done)}</span>
    </span>
  )
}
