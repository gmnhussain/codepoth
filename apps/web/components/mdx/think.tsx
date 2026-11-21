import type { ReactNode } from "react"
import { BrainIcon } from "lucide-react"

import { t } from "@workspace/config/t"

/**
 * `<Think>` inside Concept: a question for the reader on the neutral card,
 * with its `<Answer>` collapsed underneath (ADR-0018).
 */
export function Think({ children }: { readonly children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-input bg-card p-6 leading-reading sm:px-7">
      <p
        data-pagefind-ignore="all"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <BrainIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        {t("lesson.think")}
      </p>
      {/* Spaced blocks, not flex items: a one-line element's text and
          inline code stay on one line. */}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
