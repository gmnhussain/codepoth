import type { ComponentProps } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A small rounded label (track, position, "অভিজ্ঞদের জন্য"). Wraps the
 * generated Badge instead of editing it; the card fill replaces the badge's
 * grey outline fill (design.md#shadcn-customisations).
 */
export function Chip({ className, ...props }: ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-full bg-card px-2.5 text-sm text-foreground/80",
        className
      )}
      {...props}
    />
  )
}
