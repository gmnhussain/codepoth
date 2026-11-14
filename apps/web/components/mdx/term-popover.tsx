"use client"

import type { ReactNode } from "react"
import { ArrowRightIcon } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { useT } from "@/lib/labels-context"

/**
 * A glossary term in lesson prose: a dotted-underline button that opens the
 * definition on click or keyboard (the definition is rendered on the server
 * and passed in), with a link to the term on the glossary page.
 */
export function TermPopover({
  term,
  termBn,
  href,
  definition,
  children,
}: {
  readonly term: string
  readonly termBn: string
  /** The term's card on the glossary page: /glossary#<id>. */
  readonly href: string
  readonly definition: ReactNode
  readonly children?: ReactNode
}) {
  const t = useT(["term"])
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
        {/* A plain <a>: a full navigation sets :target, which outlines the
            term's card; next/link's pushState would not. */}
        <a
          href={href}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
        >
          {t("term.seeInGlossary")}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </a>
      </PopoverContent>
    </Popover>
  )
}
