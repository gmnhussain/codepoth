import { z } from "zod"

import { slugSchema, topicKeySchema } from "./common.schema"

/** Where a topic's label sits relative to its dot. */
export const MAP_LABEL_POSITIONS = [
  "top",
  "bottom",
  "left",
  "right",
  "top-right",
] as const

const NUMBER = "\\d+(?:\\.\\d+)?"
const POINT = `${NUMBER},${NUMBER}`

/** Two or more `x,y` pairs separated by single spaces. */
const POINTS = new RegExp(`^${POINT}(?: ${POINT})+$`)

const coordinateSchema = z.number().nonnegative()

/** `content/map.json`: the roadmap drawing (docs/content-model.md). */
export const mapSchema = z
  .strictObject({
    width: z.number().positive(),
    height: z.number().positive(),
    /** Track id → polyline points, e.g. "560,80 560,360". */
    lines: z.record(
      slugSchema,
      z.string().regex(POINTS, 'Points are "x,y x,y …"')
    ),
    /** Topic key → position of its dot and label. */
    topics: z.record(
      topicKeySchema,
      z.strictObject({
        x: coordinateSchema,
        y: coordinateSchema,
        label: z.enum(MAP_LABEL_POSITIONS),
      })
    ),
  })
  .superRefine((map, ctx) => {
    for (const [key, topic] of Object.entries(map.topics)) {
      if (topic.x > map.width || topic.y > map.height) {
        ctx.addIssue({
          code: "custom",
          path: ["topics", key],
          message: "Topic lies outside the map",
        })
      }
    }
  })

/** Validated `map.json`. */
export type MapData = z.infer<typeof mapSchema>
