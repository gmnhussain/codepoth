import type { ReactNode } from "react"

import { BlockSection } from "@/components/mdx/block-section"

/** Block 1: the TL;DR, a tinted card in the track colour. */
export function Summary({ children }: { readonly children?: ReactNode }) {
  return (
    <BlockSection
      block="summary"
      className="gap-3 rounded-2xl border border-track/30 bg-track/5 p-6 sm:px-7 [&_ul]:space-y-2"
    >
      {children}
    </BlockSection>
  )
}
