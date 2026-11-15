"use client"

import { StationDot } from "@/components/station-dot"
import { summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * `StationDot` with the reader's state for a topic's lessons, for server
 * pages (the topic page's track strip). Empty in the first-visit HTML; the
 * fill changes in place.
 */
export function TopicStateDot({
  lessonIds,
  className,
}: {
  readonly lessonIds: readonly string[]
  readonly className?: string
}) {
  return (
    <StationDot
      state={summarize(useProgress(), lessonIds).state}
      {...(className === undefined ? {} : { className })}
    />
  )
}
