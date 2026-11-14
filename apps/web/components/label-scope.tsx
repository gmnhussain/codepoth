import type { ReactNode } from "react"

import { activeNamespaces } from "@workspace/config/t"
import type { LabelNamespace } from "@workspace/config/translate"

import { LabelsProvider } from "@/lib/labels-context"

/**
 * Hands the client components below only the label groups they use, picked
 * from the active set on the server (ADR-0013). Only these groups reach the
 * browser, as data in the page, instead of the whole set in the JavaScript.
 */
export function LabelScope({
  namespaces,
  children,
}: {
  readonly namespaces: readonly LabelNamespace[]
  readonly children: ReactNode
}) {
  return (
    <LabelsProvider labels={activeNamespaces(namespaces)}>
      {children}
    </LabelsProvider>
  )
}
