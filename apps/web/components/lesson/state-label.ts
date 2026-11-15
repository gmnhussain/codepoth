import type { LessonState } from "@/lib/progress/selectors"

/** The label key that names each lesson state. */
export const STATE_LABEL = {
  done: "status.done",
  "in-progress": "status.inProgress",
  "not-started": "status.notStarted",
} as const satisfies Record<LessonState, `status.${string}`>
