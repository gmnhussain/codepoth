import type { ReactNode } from "react"

import { formatNumber } from "@workspace/config/format"

import { BlockSection } from "@/components/mdx/block-section"
import { withNumberedItems } from "@/components/mdx/numbered-items"

/**
 * The Mistakes block: common mistakes in a dashed card. The author's
 * numbered list becomes items with round Bangla number badges.
 */
export function Mistakes({ children }: { readonly children?: ReactNode }) {
  return (
    <BlockSection
      block="mistakes"
      className="rounded-2xl border border-dashed border-foreground/20 bg-muted p-6 sm:px-7"
    >
      {withNumberedItems(children, (items) => (
        <ol className="flex flex-col gap-5">
          {items.map((item, index) => (
            <li key={index} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-input bg-card font-mono text-sm"
              >
                {formatNumber(index + 1)}
              </span>
              <div className="leading-reading">{item}</div>
            </li>
          ))}
        </ol>
      ))}
    </BlockSection>
  )
}
