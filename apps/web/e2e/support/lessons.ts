import type { APIRequestContext } from "@playwright/test"

import { parseResumeIndex } from "@/lib/progress/resume"
import type { ResumeIndex } from "@/lib/progress/resume"

/** One lesson of the build under test, from its `/lessons.json`. */
export type BuiltLesson = {
  readonly id: string
  readonly title: string
  readonly url: string
  readonly scope: string
}

/**
 * The build's lesson index (`/lessons.json`, the same file Home fetches),
 * checked with the app's own parser. Tests pick lessons from it by rule,
 * never by name.
 */
export async function lessonIndex(
  request: APIRequestContext
): Promise<ResumeIndex> {
  const response = await request.get("/lessons.json")
  const index = parseResumeIndex(await response.json())
  if (index === undefined) throw new Error("/lessons.json has the wrong shape")
  return index
}

/** The index's lessons in its order, with their ids. */
export function lessonsOf(index: ResumeIndex): BuiltLesson[] {
  return Object.entries(index.lessons).map(([id, lesson]) => ({
    id,
    ...lesson,
  }))
}

/** A lesson's topic page: its URL without the last segment (ADR-0006). */
export function topicUrlOf(lesson: BuiltLesson): string {
  return lesson.url.slice(0, lesson.url.lastIndexOf("/"))
}
