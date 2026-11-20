import type { ReactNode } from "react"

import { Callout } from "@/components/mdx/callout"

/** `<Tip>` inside Concept: a practical shortcut or habit. */
export function Tip({ children }: { readonly children?: ReactNode }) {
  return <Callout tone="tip">{children}</Callout>
}
