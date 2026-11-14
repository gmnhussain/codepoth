import type { Labels } from "./labels"
import bnMetro from "./labels/bn-metro.json"
import bnPath from "./labels/bn-path.json"

/**
 * Every label set by id, for tests only: importing this in app code would put
 * every set into the client bundle. `satisfies` makes a set with a missing
 * key fail typecheck.
 */
export const LABEL_SETS = {
  "bn-metro": bnMetro,
  "bn-path": bnPath,
} as const satisfies Record<string, Labels>

/** Id of a label set. */
export type LabelSetId = keyof typeof LABEL_SETS
