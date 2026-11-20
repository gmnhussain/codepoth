import type { ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * A native <details> with a chevron, closed by default. The keyboard opens it
 * (Enter or Space on the summary) with no JavaScript
 * (docs/development/performance.md#loaded-only-when-needed). With
 * `searchable={false}` its text stays out of the search index, so an answer
 * or solution never shows up in a search excerpt (ADR-0018).
 */
export function Disclosure({
  summary,
  searchable = true,
  className,
  children,
}: {
  readonly summary: ReactNode
  readonly searchable?: boolean
  readonly className?: string
  readonly children?: ReactNode
}) {
  return (
    <details
      {...(searchable ? {} : { "data-pagefind-ignore": "all" })}
      className={cn(
        "group/disclosure rounded-xl border border-input bg-card",
        className
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{summary}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground group-open/disclosure:rotate-180 motion-safe:transition-transform"
        />
      </summary>
      <div className="flex flex-col gap-4 border-t px-4 pt-4 pb-5 leading-reading">
        {children}
      </div>
    </details>
  )
}
