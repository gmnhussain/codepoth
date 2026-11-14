import { TRACK_COLORS } from "@workspace/config/track-colors"
import { z } from "zod"

import { slugSchema, textSchema, topicRefSchema } from "./common.schema"

/** `tracks/<track>/_meta.json` (docs/content-model.md). */
export const trackMetaSchema = z.strictObject({
  /** Bangla subtitle. */
  title: textSchema,
  /** Shown as the track's name (ADR-0009). */
  titleEn: textSchema,
  /** Hue from the track palette (ADR-0008). */
  color: z.enum(TRACK_COLORS),
  /** Topics in order: own topic folders, or `@track/topic` for topics that live in another track. */
  order: z.array(z.union([slugSchema, topicRefSchema])).min(1),
})

/** A track's `_meta.json`. */
export type TrackMeta = z.infer<typeof trackMetaSchema>
