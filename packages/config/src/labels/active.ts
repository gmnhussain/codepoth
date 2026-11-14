import type { Labels } from "../labels"
import activeSet from "./bn-metro.json"

/**
 * The label set `t()` uses. It is imported statically so only this one set
 * reaches the browser. It must be the set `site.labelSet` names; a test
 * checks that, so switching terminology means changing both lines together
 * (ADR-0003).
 */
export const ACTIVE_LABEL_SET_ID = "bn-metro"

/** Strings of the active label set. */
export const activeLabels: Labels = activeSet
