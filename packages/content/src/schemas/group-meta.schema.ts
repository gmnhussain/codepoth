import { z } from "zod"

import { slugSchema, textSchema } from "./common.schema"

/** `tracks/<track>/<topic>/<group>/_meta.json` (docs/content-model.md). */
export const groupMetaSchema = z.strictObject({
  title: textSchema,
  description: textSchema,
  /** Lessons in order (file names without `.mdx`). */
  order: z.array(slugSchema).min(1),
})

/** A group's `_meta.json`. */
export type GroupMeta = z.infer<typeof groupMetaSchema>
