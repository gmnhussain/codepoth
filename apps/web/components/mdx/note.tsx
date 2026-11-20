import type { ReactNode } from "react"

import { Callout } from "@/components/mdx/callout"

/** `<Note>` inside Concept: background or a side remark. */
export function Note({ children }: { readonly children?: ReactNode }) {
  return <Callout tone="note">{children}</Callout>
}
