import type { ComponentProps } from "react"

import { t } from "@workspace/config/t"
import { cn } from "@workspace/ui/lib/utils"

import { CopyButton } from "@/components/mdx/copy-button"

/**
 * Code blocks from rehype-pretty-code (ADR-0010): always dark on `bg-code`,
 * token colours from the Shiki theme, file name in the caption, line
 * numbers from CSS counters (globals.css) and a copy button.
 */
export function CodeFigure({
  className,
  children,
  ...props
}: ComponentProps<"figure">) {
  return (
    <figure
      data-copy-root=""
      className={cn(
        "relative overflow-hidden rounded-xl bg-code text-code-foreground [&:not(:has(figcaption))>pre]:pt-12",
        className
      )}
      {...props}
    >
      {children}
      <CopyButton
        label={t("copy.code")}
        className="absolute top-1.5 right-2 text-code-foreground hover:bg-code-foreground/10 hover:text-code-foreground"
      />
    </figure>
  )
}

/** The file-name caption of a code block; leaves room for the copy button. */
export function CodeCaption({
  className,
  ...props
}: ComponentProps<"figcaption">) {
  return (
    <figcaption
      lang="en"
      className={cn(
        "border-b border-code-foreground/15 py-2.5 ps-5 pe-28 font-mono text-sm",
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
      data-copy-text=""
      className={cn(
        "overflow-x-auto py-4 font-mono text-sm leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-code-foreground",
        className
      )}
      {...props}
    />
  )
}
