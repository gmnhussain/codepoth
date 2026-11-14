import type { ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"

import { t } from "@workspace/config/t"

import { Chip } from "@/components/chip"
import { BlockHeading } from "@/components/mdx/block-heading"

/**
 * Block 5: the deep dive, closed by default. A native <details> needs no
 * JavaScript (docs/development/performance.md#loaded-only-when-needed).
 */
export function DeepDive({
  hint,
  children,
}: {
  readonly hint?: string
  readonly children?: ReactNode
}) {
  return (
    <section
      id="deep-dive"
      aria-labelledby="deep-dive-heading"
      className="scroll-mt-24"
    >
      <details className="group rounded-2xl border border-input bg-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3 p-6 sm:px-7 [&::-webkit-details-marker]:hidden">
          <span className="flex flex-1 flex-col gap-2">
            <BlockHeading block="deep-dive" id="deep-dive-heading">
              <Chip>{t("lesson.deepTag")}</Chip>
            </BlockHeading>
            {hint === undefined ? null : (
              <span className="text-sm leading-reading text-muted-foreground">
                {hint}
              </span>
            )}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="mt-2 size-5 shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
          />
        </summary>
        <div className="flex flex-col gap-5 border-t px-6 pt-5 pb-6 sm:px-7">
          {children}
        </div>
      </details>
    </section>
  )
}
