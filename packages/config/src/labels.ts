import type bnMetro from "./labels/bn-metro.json"

/**
 * Label types only. This module imports no label strings, so importing a
 * type from it adds nothing to a client bundle; the strings `t()` uses come
 * from `labels/active.ts`.
 */

/** Shape of a label set; `bn-metro` is the reference every set must match. */
export type Labels = typeof bnMetro

/** Dot-separated path to every string leaf of a label tree, e.g. `"status.done"`. */
export type LeafPath<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPath<T[K]>}`
}[keyof T & string]

/** A label key accepted by `t()`. */
export type LabelKey = LeafPath<Labels>
