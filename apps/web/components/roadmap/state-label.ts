import type { LessonState } from "@/lib/progress/selectors"

/**
 * The words for each topic state on the roadmap (filters, key, panel chip,
 * dot names): the site's one set of state words, the same as the lesson
 * marks use.
 */
export const ROADMAP_STATE_LABEL = {
  done: "status.done",
  "in-progress": "status.inProgress",
  "not-started": "status.notStarted",
} as const satisfies Record<LessonState, `status.${string}`>
