import { z } from "zod"

import { slugSchema } from "./common.schema"

/**
 * `content/tracks/_meta.json`: the order of the tracks. A track's number in
 * the UI ("লাইন ১") is its position here, computed, never stored (ADR-0009).
 */
export const tracksOrderSchema = z.strictObject({
  order: z.array(slugSchema).min(1),
})

/** Validated `tracks/_meta.json`. */
export type TracksOrder = z.infer<typeof tracksOrderSchema>
