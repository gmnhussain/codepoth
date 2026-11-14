import { formatNumber } from "./format"
import { activeLabels } from "./labels"
import type { LeafPath } from "./labels"

/** Values for `{name}` placeholders; numbers are shown with Bangla digits. */
export type LabelValues = Readonly<Record<string, string | number>>

const PLACEHOLDER = /\{(\w+)\}/g

/** Reads a dot-separated key from a label tree; throws when it is not a string. */
function lookup(labels: unknown, key: string): string {
  let node: unknown = labels
  for (const segment of key.split(".")) {
    if (
      typeof node !== "object" ||
      node === null ||
      !Object.hasOwn(node, segment)
    ) {
      throw new Error(`Unknown label key "${key}"`)
    }
    node = (node as Record<string, unknown>)[segment]
  }
  if (typeof node !== "string") {
    throw new Error(`Label key "${key}" is not a string`)
  }
  return node
}

/**
 * Creates a `t()` bound to one label set. A placeholder without a value
 * throws, so a missing value fails the build instead of reaching a reader.
 */
export function createTranslator<T extends object>(labels: T) {
  return function translate(key: LeafPath<T>, values?: LabelValues): string {
    return lookup(labels, key).replace(PLACEHOLDER, (_match, name: string) => {
      if (values === undefined || !Object.hasOwn(values, name)) {
        throw new Error(`Label "${key}" needs a value for {${name}}`)
      }
      const value = values[name]
      return typeof value === "number" ? formatNumber(value) : String(value)
    })
  }
}

/** Translates a label key with the active label set (ADR-0003). */
export const t = createTranslator(activeLabels)
