import { ACTIVITY_DAYS, firstActivityDay, shiftDay } from "./days"
import type { Progress } from "./progress.schema"

/**
 * Read-only views of the progress for the UI (ADR-0007, ADR-0014). They take
 * the lesson ids a page knows about, never the content graph; stored ids
 * that are not in the list (removed lessons) are ignored.
 */

export const LESSON_STATES = ["not-started", "in-progress", "done"] as const

export type LessonState = (typeof LESSON_STATES)[number]

export function lessonState(progress: Progress, id: string): LessonState {
  if (!Object.hasOwn(progress.lessons, id)) return "not-started"
  return progress.lessons[id]?.doneAt === undefined ? "in-progress" : "done"
}

export type ProgressSummary = {
  readonly total: number
  /** Lessons done. */
  readonly done: number
  /** Lessons opened, done ones included. */
  readonly started: number
  /** Done when every lesson is done; in progress when any is opened. */
  readonly state: LessonState
}

/** The rollup for any set of lessons: a group, topic, track or everything. */
export function summarize(
  progress: Progress,
  ids: readonly string[]
): ProgressSummary {
  let done = 0
  let started = 0
  for (const id of ids) {
    const state = lessonState(progress, id)
    if (state !== "not-started") started += 1
    if (state === "done") done += 1
  }
  const total = ids.length
  const state: LessonState =
    total > 0 && done === total
      ? "done"
      : started > 0
        ? "in-progress"
        : "not-started"
  return { total, done, started, state }
}

/** The first lesson in reading order that is not done. */
export function nextUnfinished(
  progress: Progress,
  ids: readonly string[]
): string | undefined {
  return ids.find((id) => lessonState(progress, id) !== "done")
}

/**
 * The lesson to continue a started topic with: its next unfinished lesson,
 * once any of its lessons is opened. `undefined` before the topic is started
 * and once every lesson is done.
 */
export function continueLesson(
  progress: Progress,
  topicLessonIds: readonly string[]
): string | undefined {
  if (summarize(progress, topicLessonIds).started === 0) return undefined
  return nextUnfinished(progress, topicLessonIds)
}

export type QuizResult = {
  readonly id: string
  readonly score: number
  readonly total: number
  readonly at: string
}

/** Latest quiz attempts of the listed lessons, weakest (lowest share) first, older first on a tie. */
export function quizResultsWeakestFirst(
  progress: Progress,
  ids: readonly string[]
): QuizResult[] {
  const results: QuizResult[] = []
  for (const id of new Set(ids)) {
    const quiz = Object.hasOwn(progress.lessons, id)
      ? progress.lessons[id]?.quiz
      : undefined
    if (quiz !== undefined) results.push({ id, ...quiz })
  }
  return results.sort(
    (a, b) =>
      a.score / a.total - b.score / b.total ||
      Date.parse(a.at) - Date.parse(b.at)
  )
}

/** Mean share of correct answers (0–1), each quiz weighted equally. */
export function averageQuizScore(
  results: readonly QuizResult[]
): number | undefined {
  if (results.length === 0) return undefined
  const sum = results.reduce(
    (total, result) => total + result.score / result.total,
    0
  )
  return sum / results.length
}

export type BookmarkItem = { readonly id: string; readonly at: string }

/** Bookmarks of the listed lessons, newest first. */
export function bookmarksNewestFirst(
  progress: Progress,
  ids: readonly string[]
): BookmarkItem[] {
  const known = new Set(ids)
  return Object.entries(progress.bookmarks)
    .filter(([id]) => known.has(id))
    .map(([id, bookmark]) => ({ id, at: bookmark.at }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

export type ActivityDay = { readonly day: string; readonly count: number }

/**
 * Lessons per day for the 140 days ending on `today`, oldest first, with
 * zero for days without activity. A day counts every lesson read then, even
 * one removed since: the reading happened.
 */
export function activityByDay(
  progress: Progress,
  today: string
): ActivityDay[] {
  const first = firstActivityDay(today)
  return Array.from({ length: ACTIVITY_DAYS }, (_, offset) => {
    const day = shiftDay(first, offset)
    const ids = Object.hasOwn(progress.activity, day)
      ? progress.activity[day]
      : undefined
    return { day, count: ids?.length ?? 0 }
  })
}

/** The heatmap's four shades: none, 1 lesson, 2–3, 4 or more. */
export const HEAT_LEVELS = [0, 1, 2, 3] as const

export type HeatLevel = (typeof HEAT_LEVELS)[number]

export function heatLevelOf(count: number): HeatLevel {
  if (count <= 0) return 0
  if (count === 1) return 1
  return count <= 3 ? 2 : 3
}

/** "শেষ সেভ": the latest timestamp anywhere in the data, computed, not stored. */
export function lastSaved(progress: Progress): string | undefined {
  const times: string[] = []
  for (const lesson of Object.values(progress.lessons)) {
    times.push(lesson.openedAt)
    if (lesson.doneAt !== undefined) times.push(lesson.doneAt)
    if (lesson.quiz !== undefined) times.push(lesson.quiz.at)
  }
  for (const bookmark of Object.values(progress.bookmarks)) {
    times.push(bookmark.at)
  }
  if (progress.lastRead !== undefined) times.push(progress.lastRead.at)
  let latest: string | undefined
  for (const time of times) {
    if (latest === undefined || Date.parse(time) > Date.parse(latest)) {
      latest = time
    }
  }
  return latest
}
