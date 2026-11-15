"use client"

import { CheckIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import { lessonState } from "@/lib/progress/selectors"
import type { LessonState } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

const STATE_LABEL = {
  done: "status.done",
  "in-progress": "status.inProgress",
  "not-started": "status.notStarted",
} as const satisfies Record<LessonState, `status.${string}`>

/**
 * A lesson's state as a 16px mark: a filled tick when done, a ring with a
 * dot while in progress, an empty ring before. The server and the first
 * client render show "not started" (the first-visit state); the mark changes
 * in place, so nothing moves.
 */
export function LessonStateIcon({ lessonId }: { readonly lessonId: string }) {
  const t = useT(["status"])
  const state = lessonState(useProgress(), lessonId)
  return (
    <span
      role="img"
      aria-label={t(STATE_LABEL[state])}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full",
        state === "done" && "bg-foreground text-background",
        state === "in-progress" && "border-2 border-foreground",
        state === "not-started" && "border border-muted-foreground"
      )}
    >
      {state === "done" ? (
        <CheckIcon aria-hidden="true" strokeWidth={4} className="size-2.5" />
      ) : null}
      {state === "in-progress" ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-foreground"
        />
      ) : null}
    </span>
  )
}
