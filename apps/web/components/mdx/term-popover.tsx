"use client"

import type { ReactNode } from "react"

import { t } from "@workspace/config/t"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

/**
 * A glossary term in lesson prose: a dotted-underline button that opens the
 * definition on click or keyboard (the definition is rendered on the server
 * and passed in).
 */
export function TermPopover({
  term,
  termBn,
  definition,
  children,
}: {
  readonly term: string
  readonly termBn: string
  readonly definition: ReactNode
  readonly children?: ReactNode
}) {
  return (
    <Popover>
      {/* The visible text is the accessible name (WCAG 2.5.3); Base UI
          exposes that the button opens a popover. */}
      <PopoverTrigger className="inline cursor-help rounded-sm underline decoration-foreground/50 decoration-dotted decoration-2 underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-ring">
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 gap-2 motion-reduce:animate-none">
        <span className="text-xs font-semibold text-muted-foreground">
          {t("term.tag")}
        </span>
        <PopoverTitle className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold">
          <span lang="en">{term}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {termBn}
          </span>
        </PopoverTitle>
        <div className="flex flex-col gap-3 leading-reading">{definition}</div>
      </PopoverContent>
    </Popover>
  )
}
