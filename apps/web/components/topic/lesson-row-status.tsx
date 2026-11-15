"use client"

import { cn } from "@workspace/ui/lib/utils"

import { STATE_LABEL } from "@/components/lesson/state-label"
import { useT } from "@/lib/labels-context"
import {
  LESSON_STATES,
  continueLesson,
  lessonState,
} from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * A topic lesson row's state in words ("পড়া শেষ", "পড়ছ", "শুরু হয়নি"), or
 * "এখান থেকে" on the lesson to continue with. Every text sits in the same
 * grid cell and only one is visible, so the slot is as wide as the longest
 * from the first render and the row never reflows (ADR-0014). Part of the
 * row link's name. Below `sm` it is only read, not shown: the slot would
 * squeeze the titles, and the row's state mark shows the state.
 */
export function LessonRowStatus({
  lessonId,
  topicLessonIds,
}: {
  readonly lessonId: string
  readonly topicLessonIds: readonly string[]
}) {
  const t = useT(["status", "topic"])
  const progress = useProgress()
  const isNext = continueLesson(progress, topicLessonIds) === lessonId
  const state = lessonState(progress, lessonId)
  const cell = "col-start-1 row-start-1 whitespace-nowrap"
  return (
    <span className="grid shrink-0 justify-items-end text-sm text-muted-foreground max-sm:sr-only">
      {LESSON_STATES.map((item) => (
        <span
          key={item}
          className={cn(cell, (isNext || item !== state) && "invisible")}
        >
          {t(STATE_LABEL[item])}
        </span>
      ))}
      <span
        className={cn(
          cell,
          "rounded-full border px-2 text-xs leading-5 text-foreground",
          !isNext && "invisible"
        )}
      >
        {t("topic.continueHere")}
      </span>
    </span>
  )
}
