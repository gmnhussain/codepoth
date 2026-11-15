"use client"

import { Progress, ProgressLabel } from "@workspace/ui/components/progress"

import { useT } from "@/lib/labels-context"
import { summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * A group's "{total}টির {done}টি শেষ" with a bar in the track colour. Zero
 * done in the first-visit HTML; the text and bar change in place.
 */
export function GroupProgress({
  lessonIds,
}: {
  readonly lessonIds: readonly string[]
}) {
  const t = useT(["topic"])
  const { done, total } = summarize(useProgress(), lessonIds)
  const text = t("topic.progress", { total, done })
  return (
    <Progress
      value={total === 0 ? 0 : Math.round((done / total) * 100)}
      getAriaValueText={() => text}
      className="max-w-xs flex-col gap-1.5 [&_[data-slot=progress-indicator]]:bg-track-dot [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-1.5"
    >
      <ProgressLabel className="text-sm font-normal text-foreground/80">
        {text}
      </ProgressLabel>
    </Progress>
  )
}
