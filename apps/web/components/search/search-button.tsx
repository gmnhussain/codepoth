"use client"

import { useEffect, useId, useState } from "react"
import dynamic from "next/dynamic"
import { SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { useT } from "@/lib/labels-context"
import { useIsApple } from "@/lib/search/use-is-apple"

const importDialog = () => import("@/components/search/search-dialog")

// Its own chunk, fetched on the first open (or when the button is hovered
// or focused), never with the page (ADR-0015).
const SearchDialog = dynamic(
  () => importDialog().then((module) => module.SearchDialog),
  { ssr: false }
)

function prefetchDialog() {
  void importDialog()
}

/**
 * The header's search button and the ⌘K / Ctrl+K shortcut. Below `sm` it is
 * a square icon button (no room, and phones rarely have a keyboard); the
 * shortcut box shows from `sm` and the label from `lg`. The box holds both
 * keys in one cell, only the reader's visible, so it keeps one width when
 * the platform is known after hydration.
 */
export function SearchButton() {
  const t = useT(["search"])
  const isApple = useIsApple()
  const fieldId = useId()
  const [isOpen, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)

  const openSearch = () => {
    setHasOpened(true)
    setOpen(true)
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // `code`, not `key`: the physical K, whatever the keyboard layout
      // (a Bangla layout types another letter there).
      if (
        event.code !== "KeyK" ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey ||
        event.isComposing
      ) {
        return
      }
      event.preventDefault()
      setHasOpened(true)
      setOpen(true)
      // Already open: bring focus back to the field.
      document.getElementById(fieldId)?.focus()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [fieldId])

  return (
    <>
      <Button
        variant="outline"
        aria-label={t("search.open")}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={openSearch}
        onPointerEnter={prefetchDialog}
        onFocus={prefetchDialog}
        className="w-11 gap-2.5 px-0 font-normal text-muted-foreground sm:w-auto sm:pr-2 sm:pl-3.5"
      >
        <SearchIcon aria-hidden="true" className="size-4.5" />
        <span aria-hidden="true" className="hidden lg:inline">
          {t("search.open")}
        </span>
        <kbd
          aria-hidden="true"
          className="hidden rounded-md border border-foreground/20 bg-muted px-1.5 font-mono text-xs text-foreground/80 sm:grid"
        >
          <span
            className={
              isApple
                ? "col-start-1 row-start-1"
                : "invisible col-start-1 row-start-1"
            }
          >
            {t("search.keyApple")}
          </span>
          <span
            className={
              isApple
                ? "invisible col-start-1 row-start-1"
                : "col-start-1 row-start-1"
            }
          >
            {t("search.keyOther")}
          </span>
        </kbd>
      </Button>
      {hasOpened ? (
        <SearchDialog open={isOpen} onOpenChange={setOpen} fieldId={fieldId} />
      ) : null}
    </>
  )
}
