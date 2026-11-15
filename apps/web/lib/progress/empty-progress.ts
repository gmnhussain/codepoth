import type { Progress } from "./progress.schema"

/**
 * Progress of a reader who has done nothing yet; never mutated. Kept apart
 * from the schema so the store can use it without loading Zod (ADR-0014).
 */
export const EMPTY_PROGRESS: Progress = Object.freeze({
  lessons: Object.freeze({}),
  bookmarks: Object.freeze({}),
  activity: Object.freeze({}),
})
