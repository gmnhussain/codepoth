"use client"

import { useState } from "react"
import { MenuIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Sheet, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet"

import { AppSheetContent } from "@/components/app-sheet"
import { NavLinks } from "@/components/nav-links"
import { ThemeToggle } from "@/components/theme-toggle"
import { useT } from "@/lib/labels-context"

/**
 * The page links in a top sheet, below the `lg` breakpoint; below `sm`, also
 * the theme toggle, which has no room in the header there.
 */
export function MobileNav() {
  const t = useT(["nav"])
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="icon" className="lg:hidden" />}
      >
        <MenuIcon aria-hidden="true" />
        <span className="sr-only">{t("nav.menu")}</span>
      </SheetTrigger>
      <AppSheetContent side="top" className="px-4 pt-4 pb-6">
        <SheetTitle className="sr-only">{t("nav.mobile")}</SheetTitle>
        <nav aria-label={t("nav.mobile")} className="mt-12">
          <NavLinks
            className="flex flex-col gap-1"
            linkClassName="min-h-12 rounded-xl px-4 text-lg"
            onNavigate={() => {
              setIsOpen(false)
            }}
          />
        </nav>
        {/* From sm the header has its own; display:none keeps one theme
            control in the accessibility tree at any width. */}
        <div className="mt-4 border-t pt-4 sm:hidden">
          <ThemeToggle
            variant="labelled"
            className="h-12 w-full rounded-xl px-4 text-lg"
          />
        </div>
      </AppSheetContent>
    </Sheet>
  )
}
