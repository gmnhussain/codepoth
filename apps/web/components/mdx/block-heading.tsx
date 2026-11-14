import type { ReactNode } from "react"

import { formatTwoDigits } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type { LessonBlockId } from "@workspace/content/blocks"
import { blockNumberOf } from "@workspace/content/blocks"

/** A block's h2: its computed number (০১ …) and its title from the labels. */
export function BlockHeading({
  block,
  id,
  children,
}: {
  readonly block: LessonBlockId
  readonly id?: string
  readonly children?: ReactNode
}) {
  const number = blockNumberOf(block)
  return (
    <h2
      id={id}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 text-3xl font-semibold"
    >
      {number === undefined ? null : (
        // Hidden from assistive technology: the heading's name is its title.
        <span
          aria-hidden="true"
          className="rounded-md border border-input px-2 font-mono text-sm font-medium text-muted-foreground"
        >
          {formatTwoDigits(number)}
        </span>
      )}
      {t(`blocks.${block}`)}
      {children}
    </h2>
  )
}
