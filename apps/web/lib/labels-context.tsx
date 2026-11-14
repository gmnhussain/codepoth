"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { Labels } from "@workspace/config/labels"
import type { LabelNamespace, Translate } from "@workspace/config/translate"
import { createTranslator, pickNamespaces } from "@workspace/config/translate"

/** The label groups in scope here (ADR-0013). */
const LabelsContext = createContext<Partial<Labels>>({})

/**
 * Puts label groups in scope for the client components below, on top of
 * the groups already in scope. Rendered by `LabelScope`, which picks the
 * groups on the server.
 */
export function LabelsProvider({
  labels,
  children,
}: {
  readonly labels: Partial<Labels>
  readonly children: ReactNode
}) {
  const parent = useContext(LabelsContext)
  const merged = useMemo(() => ({ ...parent, ...labels }), [parent, labels])
  return <LabelsContext value={merged}>{children}</LabelsContext>
}

/**
 * `t()` for a client component, over the groups it declares, e.g.
 * `useT(["quiz"])`. The returned `t` accepts only keys under those groups
 * (typecheck), and every render checks that each declared group is in
 * scope, so a page that forgets one fails the prerender even when the key
 * is only used after an interaction (ADR-0013).
 */
export function useT<K extends LabelNamespace>(
  namespaces: readonly K[]
): Translate<K> {
  return createTranslator(pickNamespaces(useContext(LabelsContext), namespaces))
}
