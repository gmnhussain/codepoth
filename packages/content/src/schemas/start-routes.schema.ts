import { z } from "zod"

import { textSchema, topicRefSchema } from "./common.schema"

/** A step on a start route: a topic, or a free label such as "any track". */
export const startRouteStepSchema = z.union([
  topicRefSchema,
  z.strictObject({ label: textSchema }),
])

/**
 * `content/start-routes.json`: Home's "where to start" cards (ADR-0009).
 * The list sits under `routes` because Content Collections needs an object
 * at the root of a JSON file.
 */
export const startRoutesSchema = z.strictObject({
  routes: z
    .array(
      z.strictObject({
        level: textSchema,
        title: textSchema,
        description: textSchema,
        steps: z.array(startRouteStepSchema).min(1),
      })
    )
    .min(1),
})

/** Validated start routes. */
export type StartRoutes = z.infer<typeof startRoutesSchema>
