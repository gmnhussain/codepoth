import { LESSON_ID_PATTERN } from "@workspace/content/patterns"
import { z } from "zod/mini"

import { EMPTY_PROGRESS } from "./empty-progress"

/**
 * The reader's progress as stored under `codepoth:v1` (ADR-0007). Every key
 * is a stable lesson id; every timestamp is an ISO instant; activity days are
 * the reader's local calendar dates.
 *
 * `zod/mini`: this runs in the browser on every page, and the full Zod
 * build would add about 30 KB gzip to it (ADR-0014).
 */

const lessonIdSchema = z.string().check(z.regex(LESSON_ID_PATTERN))

const timestampSchema = z.iso.datetime()

export const quizAttemptSchema = z
  .object({
    score: z.int().check(z.nonnegative()),
    total: z.int().check(z.positive()),
    at: timestampSchema,
  })
  .check(
    z.refine((attempt) => attempt.score <= attempt.total, {
      message: "A quiz score cannot exceed its total",
    })
  )

export const lessonProgressSchema = z.object({
  openedAt: timestampSchema,
  doneAt: z.optional(timestampSchema),
  quiz: z.optional(quizAttemptSchema),
})

export const bookmarkSchema = z.object({ at: timestampSchema })

export const lastReadSchema = z.object({
  id: lessonIdSchema,
  at: timestampSchema,
  anchor: z.optional(z.string().check(z.minLength(1))),
})

export const daySchema = z.iso.date()

/** The whole value, every entry valid. Used for imported files. */
export const progressSchema = z.object({
  lessons: z.record(lessonIdSchema, lessonProgressSchema),
  bookmarks: z.record(lessonIdSchema, bookmarkSchema),
  lastRead: z.optional(lastReadSchema),
  activity: z.record(
    daySchema,
    z.pipe(
      z.array(lessonIdSchema),
      z.transform((ids: string[]) => [...new Set(ids)])
    )
  ),
})

export type QuizAttempt = z.infer<typeof quizAttemptSchema>
export type LessonProgress = z.infer<typeof lessonProgressSchema>
export type Bookmark = z.infer<typeof bookmarkSchema>
export type LastRead = z.infer<typeof lastReadSchema>
export type Progress = z.infer<typeof progressSchema>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Keeps the entries whose key and value are valid, dropping the rest one by one. */
function validEntries<T>(
  value: unknown,
  keySchema: z.ZodMiniType<string>,
  parseValue: (entry: unknown) => T | undefined
): Record<string, T> {
  if (!isPlainObject(value)) return {}
  const kept: Record<string, T> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!keySchema.safeParse(key).success) continue
    const parsed = parseValue(entry)
    if (parsed !== undefined) kept[key] = parsed
  }
  return kept
}

function parseWith<T>(
  schema: z.ZodMiniType<T>
): (entry: unknown) => T | undefined {
  return (entry) => {
    const result = schema.safeParse(entry)
    return result.success ? result.data : undefined
  }
}

/** A day's lesson ids: invalid ids dropped, duplicates removed; no ids → no day. */
function parseDayIds(entry: unknown): string[] | undefined {
  if (!Array.isArray(entry)) return undefined
  const ids = new Set<string>()
  for (const id of entry) {
    const parsed = lessonIdSchema.safeParse(id)
    if (parsed.success) ids.add(parsed.data)
  }
  return ids.size > 0 ? [...ids] : undefined
}

/**
 * Reads a stored value (already JSON-parsed). Invalid entries are dropped
 * one by one; a value that is not an object at all gives empty progress
 * (ADR-0007: a corrupt value never crashes a page).
 */
export function parseStoredProgress(value: unknown): Progress {
  if (!isPlainObject(value)) return EMPTY_PROGRESS
  const lastRead = lastReadSchema.safeParse(value.lastRead)
  return {
    lessons: validEntries(
      value.lessons,
      lessonIdSchema,
      parseWith(lessonProgressSchema)
    ),
    bookmarks: validEntries(
      value.bookmarks,
      lessonIdSchema,
      parseWith(bookmarkSchema)
    ),
    ...(lastRead.success ? { lastRead: lastRead.data } : {}),
    activity: validEntries(value.activity, daySchema, parseDayIds),
  }
}
