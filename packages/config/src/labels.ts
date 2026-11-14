import bnMetro from "./labels/bn-metro.json"
import bnPath from "./labels/bn-path.json"
import { site } from "./site"

/** Shape of a label set; `bn-metro` is the reference every set must match. */
export type Labels = typeof bnMetro

/** Every label set by id. `satisfies` makes a set with a missing key fail typecheck. */
export const LABEL_SETS = {
  "bn-metro": bnMetro,
  "bn-path": bnPath,
} as const satisfies Record<string, Labels>

/** Id of a label set. */
export type LabelSetId = keyof typeof LABEL_SETS

/** Dot-separated path to every string leaf of a label tree, e.g. `"status.done"`. */
export type LeafPath<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPath<T[K]>}`
}[keyof T & string]

/** A label key accepted by `t()`. */
export type LabelKey = LeafPath<Labels>

/** The label set selected in `site.ts`. */
export const activeLabels: Labels = LABEL_SETS[site.labelSet]
