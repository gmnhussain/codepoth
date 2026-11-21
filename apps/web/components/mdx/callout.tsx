import type { ReactNode } from "react"
import { InfoIcon, LightbulbIcon, TriangleAlertIcon } from "lucide-react"

import { t } from "@workspace/config/t"
import { cn } from "@workspace/ui/lib/utils"

/** Icon and accent of each callout kind; the label comes from `lesson.<tone>`. */
const TONES = {
  note: {
    Icon: InfoIcon,
    border: "border-s-foreground/40",
    icon: "text-muted-foreground",
  },
  tip: {
    Icon: LightbulbIcon,
    border: "border-s-track-dot",
    icon: "text-track-dot",
  },
  pitfall: {
    Icon: TriangleAlertIcon,
    border: "border-s-destructive",
    icon: "text-destructive",
  },
} as const

/**
 * A callout inside Concept: a left-border box with an icon and a visible
 * label. A plain div, not <aside>, so a lesson does not fill up with
 * landmarks (ADR-0018). The label is not a word to search for.
 */
export function Callout({
  tone,
  children,
}: {
  readonly tone: keyof typeof TONES
  readonly children?: ReactNode
}) {
  const { Icon, border, icon } = TONES[tone]
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-e-xl border-s-4 bg-muted px-5 py-4 leading-reading",
        border
      )}
    >
      <p
        data-pagefind-ignore="all"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <Icon aria-hidden="true" className={cn("size-4 shrink-0", icon)} />
        {t(`lesson.${tone}`)}
      </p>
      {/* Spaced blocks, not flex items: a one-line element's text and
          inline code stay on one line. */}
      <div className="space-y-3">{children}</div>
    </div>
  )
}
