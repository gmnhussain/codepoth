import type { ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"

import { t } from "@workspace/config/t"

import { Chip } from "@/components/chip"

/**
 * `<DeepDive title="…">` inside Concept: internals, trade-offs or edge cases
 * next to the idea they explain, closed by default (ADR-0018). A native
 * <details> needs no JavaScript
 * (docs/development/performance.md#loaded-only-when-needed). Its text is
 * the lesson's own and stays searchable; the chip does not.
 */
export function DeepDive({
  title,
  hint,
  children,
}: {
  readonly title: string
  readonly hint?: string
  readonly children?: ReactNode
}) {
  return (
    <details className="group/deep-dive rounded-2xl border border-input bg-card">
      <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3 rounded-2xl p-5 focus-visible:outline-2 focus-visible:outline-ring sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-1 flex-col gap-2">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-lg font-semibold">{title}</span>
            <Chip data-pagefind-ignore="all">{t("lesson.deepTag")}</Chip>
          </span>
          {hint === undefined ? null : (
            <span className="text-sm leading-reading text-muted-foreground">
              {hint}
            </span>
          )}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-muted-foreground group-open/deep-dive:rotate-180 motion-safe:transition-transform"
        />
      </summary>
      <div className="flex flex-col gap-5 border-t px-5 pt-5 pb-6 leading-reading sm:px-6">
        {children}
      </div>
    </details>
  )
}
