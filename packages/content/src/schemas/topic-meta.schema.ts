import { z } from "zod"

import { slugSchema, textSchema, topicRefSchema } from "./common.schema"

/** `tracks/<track>/<topic>/_meta.json` (docs/content-model.md). */
export const topicMetaSchema = z.strictObject({
  title: textSchema,
  titleEn: textSchema.optional(),
  description: textSchema,
  /** Beginner entry topic: map flag and filter (ADR-0009). */
  start: z.literal(true).optional(),
  /** Groups and lessons in order (folder names and lesson file names without `.mdx`). */
  order: z.array(slugSchema).min(1),
  /** Topics to know first, as `@track/topic`. */
  prerequisites: z.array(topicRefSchema).default([]),
})

/** A topic's `_meta.json`. */
export type TopicMeta = z.infer<typeof topicMetaSchema>
