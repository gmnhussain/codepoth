"use client"

import { useEffect, useId, useState } from "react"
import { flushSync } from "react-dom"
import dynamic from "next/dynamic"
import { SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { useT } from "@/lib/labels-context"
import { useIsApple } from "@/lib/search/use-is-apple"

const importDialog = () => import("@/components/search/search-dialog")

// Its own chunk, never part of the page's First Load JS (ADR-0015). It is
// fetched when the page is idle after load, or earlier on hover, focus or
// the first open; Pagefind itself still loads only when the dialog opens.
const SearchDialog = dynamic(
  () => importDialog().then((module) => module.SearchDialog),
  { ssr: false }
)

/** The longest the idle prefetch waits for the browser to be idle. */
const IDLE_TIMEOUT_MS = 2000

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
  const [isDialogLoaded, setDialogLoaded] = useState(false)

  const loadDialog = () => {
    void importDialog().then(
      () => {
        setDialogLoaded(true)
      },
      // A failed fetch is tried again on the next hover, focus or open.
      () => undefined
    )
  }

  // Opening renders the field in the same synchronous update once the
  // dialog's module is here, so a key typed right after ⌘K or a click
  // already lands in the field. Keys are never held back and replayed:
  // that would break Bangla input methods such as Avro.
  const openSearch = () => {
    flushSync(() => {
      setHasOpened(true)
      setOpen(true)
    })
  }

  // Fetch the dialog's module once the page has loaded and is idle (with a
  // timeout, and a plain timer where requestIdleCallback is missing), so it
  // never competes with the page's own resources.
  useEffect(() => {
    let cancelIdle: () => void = () => undefined
    const scheduleIdle = () => {
      if ("requestIdleCallback" in window) {
        const handle = window.requestIdleCallback(loadDialog, {
          timeout: IDLE_TIMEOUT_MS,
        })
        cancelIdle = () => {
          window.cancelIdleCallback(handle)
        }
      } else {
        const timer = setTimeout(loadDialog, IDLE_TIMEOUT_MS)
        cancelIdle = () => {
          clearTimeout(timer)
        }
      }
    }
    if (document.readyState === "complete") {
      scheduleIdle()
    } else {
      window.addEventListener("load", scheduleIdle, { once: true })
    }
    return () => {
      window.removeEventListener("load", scheduleIdle)
      cancelIdle()
    }
  }, [])

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
      flushSync(() => {
        setHasOpened(true)
        setOpen(true)
      })
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
        onPointerEnter={loadDialog}
        onFocus={loadDialog}
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
      {/* Rendered closed as soon as its module is here, so opening needs
          no wait. Closed, it renders nothing and loads nothing. */}
      {hasOpened || isDialogLoaded ? (
        <SearchDialog open={isOpen} onOpenChange={setOpen} fieldId={fieldId} />
      ) : null}
    </>
  )
}
