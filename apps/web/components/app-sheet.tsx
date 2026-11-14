"use client"

import type { ComponentProps } from "react"
import { XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { SheetClose, SheetContent } from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"

/**
 * The panel every sheet in the app uses instead of `SheetContent`. The
 * generated close button has an English label, so it is replaced by one
 * labelled through `t()`, and the slide is turned off for reduced motion
 * (docs/design.md#shadcn-customisations).
 */
export function AppSheetContent({
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof SheetContent>, "showCloseButton">) {
  const t = useT(["common"])
  return (
    <SheetContent
      showCloseButton={false}
      className={cn("motion-reduce:transition-none", className)}
      {...props}
    >
      {children}
      <SheetClose
        render={
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3"
          />
        }
      >
        <XIcon aria-hidden="true" />
        <span className="sr-only">{t("common.close")}</span>
      </SheetClose>
    </SheetContent>
  )
}
