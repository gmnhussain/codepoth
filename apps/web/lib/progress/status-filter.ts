import { lessonState } from "./selectors"
import type { Progress } from "./progress.schema"

/** The contents page's status filter: সব, বাকি (not done), পড়া শেষ. */
export const STATUS_FILTERS = ["all", "todo", "done"] as const

export type StatusFilter = (typeof STATUS_FILTERS)[number]

/** The filter from its URL value; anything unknown counts as "all". */
export function statusFilterOf(value: string): StatusFilter {
  return value === "todo" || value === "done" ? value : "all"
}

/** Whether a lesson passes the filter: "todo" is every lesson not done. */
export function passesStatus(
  progress: Progress,
  lessonId: string,
  filter: StatusFilter
): boolean {
  if (filter === "all") return true
  const isDone = lessonState(progress, lessonId) === "done"
  return filter === "done" ? isDone : !isDone
}

/** How many of the lessons pass each filter. */
export function statusCounts(
  progress: Progress,
  lessonIds: readonly string[]
): Record<StatusFilter, number> {
  const done = lessonIds.filter((id) =>
    passesStatus(progress, id, "done")
  ).length
  return { all: lessonIds.length, todo: lessonIds.length - done, done }
}
