import { z } from "zod"

import type { Labels } from "./labels"

/** A label tree: nested objects whose leaves are non-empty strings. */
type LabelTree = { readonly [key: string]: string | LabelTree }

function schemaFor(reference: LabelTree): z.ZodType {
  const shape: Record<string, z.ZodType> = {}
  for (const [key, value] of Object.entries(reference)) {
    shape[key] =
      typeof value === "string" ? z.string().trim().min(1) : schemaFor(value)
  }
  return z.strictObject(shape)
}

/**
 * Zod schema every label set must pass: exactly the keys of the reference
 * set (no missing, no extra), each a non-empty string.
 */
export function labelSetSchema(reference: Labels): z.ZodType {
  return schemaFor(reference)
}
