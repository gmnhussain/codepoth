"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { ListIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Sheet, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet"

import { AppSheetContent } from "@/components/app-sheet"
import { useT } from "@/lib/labels-context"

/**
 * The lesson's track navigation in a left sheet, below `lg` where the side
 * column is hidden. The navigation itself is rendered on the server and
 * passed in; following a link closes the sheet.
 */
export function LessonNavDrawer({
  title,
  children,
}: {
  /** Accessible title of the sheet, e.g. "Frontend লাইনের স্টেশন". */
  readonly title: string
  readonly children: ReactNode
}) {
  const t = useT(["lesson"])
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" className="lg:hidden" />}
      >
        <ListIcon aria-hidden="true" />
        {t("lesson.openTrackNav")}
      </SheetTrigger>
      <AppSheetContent side="left" className="overflow-y-auto px-5 pt-16 pb-8">
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <div
          onClickCapture={(event) => {
            if ((event.target as HTMLElement).closest("a") !== null) {
              setIsOpen(false)
            }
          }}
        >
          {children}
        </div>
      </AppSheetContent>
    </Sheet>
  )
}
