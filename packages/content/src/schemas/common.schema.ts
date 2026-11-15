import { z } from "zod"

import { KEBAB, LESSON_ID_PATTERN } from "../patterns"

/** One kebab-case path segment: a track, topic, group, lesson or glossary file name. */
export const slugSchema = z
  .string()
  .regex(new RegExp(`^${KEBAB}$`), "Use lower-case kebab-case (a-z, 0-9, -)")

/** Stable lesson id: two or more kebab-case segments joined by dots (ADR-0002). */
export const lessonIdSchema = z
  .string()
  .regex(
    LESSON_ID_PATTERN,
    "A lesson id is dot-separated kebab-case, e.g. frontend.react.hooks.use-effect"
  )

/** Reference to a topic by track: `@track/topic` (ADR-0006). */
export const topicRefSchema = z
  .string()
  .regex(
    new RegExp(`^@${KEBAB}/${KEBAB}$`),
    "A topic reference is @track/topic"
  )

/** Path key of a topic: `track/topic` (ADR-0006). Never stored in reader progress. */
export const topicKeySchema = z
  .string()
  .regex(new RegExp(`^${KEBAB}/${KEBAB}$`), "A topic key is track/topic")

/** Calendar date written as YYYY-MM-DD. */
export const dateSchema = z.iso.date()

/** Non-empty display text with no leading or trailing whitespace. */
export const textSchema = z.string().trim().min(1)
