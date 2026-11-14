import { formatNumber } from "./format"
import type { Labels, LeafPath } from "./labels"

/**
 * The translator itself, with no label strings: client code imports this
 * module and gets its labels as data (a `LabelScope` on the page), so the
 * full label set never reaches the browser (ADR-0013). `t` in `t.ts` binds
 * it to the active set for server code.
 */

/** Values for `{name}` placeholders; numbers are shown with Bangla digits. */
export type LabelValues = Readonly<Record<string, string | number>>

/** A top-level label group, e.g. `"contents"` or `"quiz"`. */
export type LabelNamespace = keyof Labels

/**
 * A `t()` that accepts only keys under the given groups (all groups by
 * default). The server `t` fits every `Translate<K>`; an island's `useT(K)`
 * fits only its own groups, so a key outside them fails typecheck.
 */
export type Translate<K extends LabelNamespace = LabelNamespace> = (
  key: LeafPath<Pick<Labels, K>>,
  values?: LabelValues
) => string

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
 * Creates a `t()` bound to one label tree. A placeholder without a value
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

/** Whether every given group is present (checked at runtime, not assumed). */
function hasGroups<K extends LabelNamespace>(
  groups: Partial<Pick<Labels, K>>,
  namespaces: readonly K[]
): groups is Pick<Labels, K> {
  return namespaces.every((namespace) => groups[namespace] !== undefined)
}

/**
 * The given top-level groups of a label tree. Throws when one is missing,
 * naming it, so an island whose page forgot a group fails the prerender
 * (ADR-0013).
 */
export function pickNamespaces<K extends LabelNamespace>(
  labels: Partial<Labels>,
  namespaces: readonly K[]
): Pick<Labels, K> {
  const groups: Partial<Pick<Labels, K>> = {}
  for (const namespace of namespaces) {
    const group = labels[namespace]
    if (group === undefined) {
      throw new Error(
        `Label group "${namespace}" is not in scope: add it to the page's LabelScope`
      )
    }
    groups[namespace] = group
  }
  if (!hasGroups(groups, namespaces)) {
    throw new Error(
      `Label groups ${namespaces.join(", ")} are not all in scope`
    )
  }
  return groups
}
