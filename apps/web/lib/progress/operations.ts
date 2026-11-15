import { localDay, pruneActivity } from "./days"
import type { LessonProgress, Progress } from "./progress.schema"

/**
 * What the reader does, as pure updates of the stored progress (ADR-0007).
 * Each one returns a new value and never changes its input; when nothing
 * changes it returns the input itself, so the store can skip the write.
 */

function lessonOf(progress: Progress, id: string): LessonProgress | undefined {
  return Object.hasOwn(progress.lessons, id) ? progress.lessons[id] : undefined
}

/** Today's activity with `id` added once; days outside the window pruned. */
function activityWith(
  activity: Progress["activity"],
  id: string,
  now: Date
): Progress["activity"] {
  const today = localDay(now)
  const pruned = pruneActivity(activity, today)
  const ids = Object.hasOwn(pruned, today) ? (pruned[today] ?? []) : []
  if (ids.includes(id)) return pruned
  return { ...pruned, [today]: [...ids, id] }
}

/**
 * A lesson page view: creates the entry with `openedAt` on the first visit
 * (never overwritten), moves `lastRead` to this lesson and counts today's
 * activity. Reopening the last-read lesson keeps its section anchor.
 */
export function recordOpen(
  progress: Progress,
  id: string,
  now: Date
): Progress {
  const at = now.toISOString()
  const previous = progress.lastRead
  const anchor = previous?.id === id ? previous.anchor : undefined
  return {
    ...progress,
    lessons: lessonOf(progress, id)
      ? progress.lessons
      : { ...progress.lessons, [id]: { openedAt: at } },
    lastRead: { id, at, ...(anchor === undefined ? {} : { anchor }) },
    activity: activityWith(progress.activity, id, now),
  }
}

/**
 * The section the reader is in. `undefined` means the top of the lesson.
 * Unchanged when `lastRead` already points there.
 */
export function recordAnchor(
  progress: Progress,
  id: string,
  anchor: string | undefined,
  now: Date
): Progress {
  const previous = progress.lastRead
  if (previous?.id === id && previous.anchor === anchor) return progress
  return {
    ...progress,
    lastRead: {
      id,
      at: now.toISOString(),
      ...(anchor === undefined ? {} : { anchor }),
    },
  }
}

/** Marks a lesson done (opening it too if needed). Already done: unchanged. */
export function markDone(progress: Progress, id: string, now: Date): Progress {
  const lesson = lessonOf(progress, id)
  if (lesson?.doneAt !== undefined) return progress
  const at = now.toISOString()
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [id]: { ...(lesson ?? { openedAt: at }), doneAt: at },
    },
    activity: activityWith(progress.activity, id, now),
  }
}

/** Removes `doneAt` and keeps the entry: the lesson is in progress again. */
export function unmarkDone(progress: Progress, id: string): Progress {
  const lesson = lessonOf(progress, id)
  if (lesson?.doneAt === undefined) return progress
  const reopened: LessonProgress = {
    openedAt: lesson.openedAt,
    ...(lesson.quiz === undefined ? {} : { quiz: lesson.quiz }),
  }
  return { ...progress, lessons: { ...progress.lessons, [id]: reopened } }
}

/** Adds or removes a bookmark. Already in that state: unchanged. */
export function setBookmark(
  progress: Progress,
  id: string,
  isBookmarked: boolean,
  now: Date
): Progress {
  const has = Object.hasOwn(progress.bookmarks, id)
  if (has === isBookmarked) return progress
  if (isBookmarked) {
    return {
      ...progress,
      bookmarks: { ...progress.bookmarks, [id]: { at: now.toISOString() } },
    }
  }
  return {
    ...progress,
    bookmarks: Object.fromEntries(
      Object.entries(progress.bookmarks).filter(([key]) => key !== id)
    ),
  }
}

/**
 * Saves a finished quiz attempt, replacing the previous one (only the latest
 * is kept), and counts today's activity.
 */
export function recordQuiz(
  progress: Progress,
  id: string,
  score: number,
  total: number,
  now: Date
): Progress {
  if (
    !Number.isInteger(score) ||
    !Number.isInteger(total) ||
    total < 1 ||
    score < 0 ||
    score > total
  ) {
    throw new RangeError(
      `Invalid quiz result ${String(score)}/${String(total)}`
    )
  }
  const at = now.toISOString()
  const lesson = lessonOf(progress, id) ?? { openedAt: at }
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [id]: { ...lesson, quiz: { score, total, at } },
    },
    activity: activityWith(progress.activity, id, now),
  }
}
