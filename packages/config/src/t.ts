import { activeLabels } from "./labels/active"
import type { LabelNamespace } from "./translate"
import { createTranslator, pickNamespaces } from "./translate"

export { createTranslator } from "./translate"
export type { LabelValues } from "./translate"

/**
 * Translates a label key with the active label set (ADR-0003). Server code
 * only: importing this module bundles the whole set, so a `"use client"`
 * file uses `useT()` instead (lint-enforced, ADR-0013).
 */
export const t = createTranslator(activeLabels)

/** The active set's given groups, the data a `LabelScope` hands to islands. */
export function activeNamespaces<K extends LabelNamespace>(
  namespaces: readonly K[]
) {
  return pickNamespaces(activeLabels, namespaces)
}
