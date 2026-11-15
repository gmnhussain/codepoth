import type { LessonState } from "./selectors"

/**
 * The roadmap's topic filter: সব, শুরুর স্টেশন, then the reader's state
 * (পড়া শেষ, পড়ছি, বাকি). One choice at a time, in `?filter=`.
 */
export const ROADMAP_FILTERS = [
  "all",
  "start",
  "done",
  "reading",
  "todo",
] as const

export type RoadmapFilter = (typeof ROADMAP_FILTERS)[number]

/** The filter from its URL value; anything unknown (or none) counts as "all". */
export function roadmapFilterOf(value: string): RoadmapFilter {
  return ROADMAP_FILTERS.find((filter) => filter === value) ?? "all"
}

/** The state filter each lesson-derived topic state answers to. */
const FILTER_OF_STATE = {
  done: "done",
  "in-progress": "reading",
  "not-started": "todo",
} as const satisfies Record<LessonState, RoadmapFilter>

/**
 * Whether a topic passes the filter. A planned topic (no lessons yet) has
 * no reader state, so the state filters leave it out.
 */
export function passesRoadmapFilter(
  filter: RoadmapFilter,
  topic: { readonly isStart: boolean; readonly lessonCount: number },
  state: LessonState
): boolean {
  if (filter === "all") return true
  if (filter === "start") return topic.isStart
  return topic.lessonCount > 0 && FILTER_OF_STATE[state] === filter
}
