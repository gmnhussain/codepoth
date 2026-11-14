import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Code blocks from rehype-pretty-code (ADR-0010): always dark on `bg-code`,
 * token colours from the Shiki theme, file name in the caption, line
 * numbers from CSS counters (globals.css). The copy button is added by the
 * interactive layer.
 */
export function CodeFigure({ className, ...props }: ComponentProps<"figure">) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl bg-code text-code-foreground",
        className
      )}
      {...props}
    />
  )
}

/** The file-name caption of a code block. */
export function CodeCaption({
  className,
  ...props
}: ComponentProps<"figcaption">) {
  return (
    <figcaption
      lang="en"
      className={cn(
        "border-b border-code-foreground/15 px-5 py-2.5 font-mono text-sm",
        className
      )}
      {...props}
    />
  )
}

/** The scrollable code area; focusable (tabIndex from the compiler) for keyboard scrolling. */
export function CodePre({ className, ...props }: ComponentProps<"pre">) {
  return (
    <pre
      className={cn(
        "overflow-x-auto py-4 font-mono text-sm leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-code-foreground",
        className
      )}
      {...props}
    />
  )
}
