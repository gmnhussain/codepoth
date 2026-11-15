import { localDay, pruneActivity } from "./days"
import type {
  Bookmark,
  LastRead,
  LessonProgress,
  Progress,
  QuizAttempt,
} from "./progress.schema"

/**
 * Import with "merge" (ADR-0007): per lesson the earliest `openedAt`, the
 * latest `doneAt` and the latest quiz attempt; the union of bookmarks (each
 * with its earliest `at`) and of activity; the most recent `lastRead`.
 * Activity outside the 140-day window ending on `now` is pruned.
 */

/** Timestamps can differ in how many fraction digits they carry, so compare parsed times. */
function time(iso: string): number {
  return Date.parse(iso)
}

function earliest(a: string, b: string): string {
  return time(b) < time(a) ? b : a
}

function latest(
  a: string | undefined,
  b: string | undefined
): string | undefined {
  if (a === undefined) return b
  if (b === undefined) return a
  return time(b) > time(a) ? b : a
}

/** The one of two dated values with the later `at`; on a tie, the first. */
function latestByAt<T extends { readonly at: string }>(
  a: T | undefined,
  b: T | undefined
): T | undefined {
  if (a === undefined) return b
  if (b === undefined) return a
  return time(b.at) > time(a.at) ? b : a
}

function mergeLesson(a: LessonProgress, b: LessonProgress): LessonProgress {
  const doneAt = latest(a.doneAt, b.doneAt)
  const quiz = latestByAt<QuizAttempt>(a.quiz, b.quiz)
  return {
    openedAt: earliest(a.openedAt, b.openedAt),
    ...(doneAt === undefined ? {} : { doneAt }),
    ...(quiz === undefined ? {} : { quiz }),
  }
}

/** Every key of both records; a key in both is combined with `combine`. */
function mergeRecords<T>(
  a: Record<string, T>,
  b: Record<string, T>,
  combine: (a: T, b: T) => T
): Record<string, T> {
  const merged: Record<string, T> = { ...a }
  for (const [key, value] of Object.entries(b)) {
    const existing = Object.hasOwn(merged, key) ? merged[key] : undefined
    merged[key] = existing === undefined ? value : combine(existing, value)
  }
  return merged
}

export function mergeProgress(
  current: Progress,
  incoming: Progress,
  now: Date
): Progress {
  const lastRead = latestByAt<LastRead>(current.lastRead, incoming.lastRead)
  const activity = mergeRecords(current.activity, incoming.activity, (a, b) => [
    ...new Set([...a, ...b]),
  ])
  return {
    lessons: mergeRecords(current.lessons, incoming.lessons, mergeLesson),
    bookmarks: mergeRecords(
      current.bookmarks,
      incoming.bookmarks,
      (a: Bookmark, b: Bookmark) => ({ at: earliest(a.at, b.at) })
    ),
    ...(lastRead === undefined ? {} : { lastRead }),
    activity: pruneActivity(activity, localDay(now)),
  }
}
