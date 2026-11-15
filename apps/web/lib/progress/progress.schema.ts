import { lessonIdSchema } from "@workspace/content/schemas/common"
import { z } from "zod"

/**
 * The reader's progress as stored under `codepoth:v1` (ADR-0007). Every key
 * is a stable lesson id; every timestamp is an ISO instant; activity days are
 * the reader's local calendar dates.
 */

const timestampSchema = z.iso.datetime()

export const quizAttemptSchema = z
  .object({
    score: z.int().nonnegative(),
    total: z.int().positive(),
    at: timestampSchema,
  })
  .refine((attempt) => attempt.score <= attempt.total, {
    message: "A quiz score cannot exceed its total",
  })

export const lessonProgressSchema = z.object({
  openedAt: timestampSchema,
  doneAt: timestampSchema.optional(),
  quiz: quizAttemptSchema.optional(),
})

export const bookmarkSchema = z.object({ at: timestampSchema })

export const lastReadSchema = z.object({
  id: lessonIdSchema,
  at: timestampSchema,
  anchor: z.string().min(1).optional(),
})

export const daySchema = z.iso.date()

/** The whole value, every entry valid. Used for imported files. */
export const progressSchema = z.object({
  lessons: z.record(lessonIdSchema, lessonProgressSchema),
  bookmarks: z.record(lessonIdSchema, bookmarkSchema),
  lastRead: lastReadSchema.optional(),
  activity: z.record(
    daySchema,
    z.array(lessonIdSchema).transform((ids) => [...new Set(ids)])
  ),
})

export type QuizAttempt = z.infer<typeof quizAttemptSchema>
export type LessonProgress = z.infer<typeof lessonProgressSchema>
export type Bookmark = z.infer<typeof bookmarkSchema>
export type LastRead = z.infer<typeof lastReadSchema>
export type Progress = z.infer<typeof progressSchema>

/** Progress of a reader who has done nothing yet; never mutated. */
export const EMPTY_PROGRESS: Progress = Object.freeze({
  lessons: Object.freeze({}),
  bookmarks: Object.freeze({}),
  activity: Object.freeze({}),
})

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Keeps the entries whose key and value are valid, dropping the rest one by one. */
function validEntries<T>(
  value: unknown,
  keySchema: z.ZodType<string>,
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

function parseWith<T>(schema: z.ZodType<T>): (entry: unknown) => T | undefined {
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
