import type { ReactNode } from "react"

import { t } from "@workspace/config/t"
import type { LessonBlockId } from "@workspace/content/blocks"

/** A block's h2: its title from the labels (ADR-0018: blocks have no numbers). */
export function BlockHeading({
  block,
  id,
  children,
}: {
  readonly block: LessonBlockId
  readonly id?: string
  readonly children?: ReactNode
}) {
  return (
    <h2
      id={id}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 text-3xl font-semibold"
    >
      {t(`blocks.${block}`)}
      {children}
    </h2>
  )
}
