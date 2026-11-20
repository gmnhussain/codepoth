import type { ReactNode } from "react"

import { Callout } from "@/components/mdx/callout"

/** `<Pitfall>` inside Concept: a trap to watch for while learning the idea. */
export function Pitfall({ children }: { readonly children?: ReactNode }) {
  return <Callout tone="pitfall">{children}</Callout>
}
