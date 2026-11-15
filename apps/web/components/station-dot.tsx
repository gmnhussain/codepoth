import { cn } from "@workspace/ui/lib/utils"

import type { LessonState } from "@/lib/progress/selectors"

/**
 * A topic's dot in the track colour, showing the reader's state: filled when
 * every lesson is done, a ring with a centre dot while in progress, an empty
 * ring before. Size, border width and extra rings come from `className`.
 * Hook-free, so the roadmap canvas (also a static preview on the server)
 * and the topic page's track strip draw the same dot.
 */
export function StationDot({
  state,
  className,
}: {
  readonly state: LessonState
  readonly className?: string
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full border-track-dot",
        state === "done" ? "bg-track-dot" : "bg-background",
        className
      )}
    >
      {state === "in-progress" ? (
        <span className="size-2/5 rounded-full bg-track-dot" />
      ) : null}
    </span>
  )
}
