import type { ReactNode } from "react"

import type { LessonBlockId } from "@workspace/content/blocks"
import { cn } from "@workspace/ui/lib/utils"

import { BlockHeading } from "@/components/mdx/block-heading"

/**
 * One template block on the page: a section with the block's id (the TOC
 * and "#quiz" links target it) and its h2.
 */
export function BlockSection({
  block,
  className,
  children,
}: {
  readonly block: LessonBlockId
  readonly className?: string
  readonly children?: ReactNode
}) {
  return (
    <section
      id={block}
      aria-labelledby={`${block}-heading`}
      className={cn("flex scroll-mt-24 flex-col gap-5", className)}
    >
      <BlockHeading block={block} id={`${block}-heading`} />
      {children}
    </section>
  )
}
