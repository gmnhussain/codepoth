"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { useT } from "@/lib/labels-context"
import { loadPagefind, usePagefindStatus } from "@/lib/search/pagefind.client"
import { useIsApple } from "@/lib/search/use-is-apple"

const KBD =
  "rounded-md border border-foreground/20 bg-muted px-1.5 font-mono text-xs text-foreground/80"

/**
 * The site search (ADR-0015): a field near the top of the screen, so a
 * growing list below never moves it. Loaded with its module on the first
 * open; Pagefind loads when it opens. Base UI's dialog traps focus, closes
 * on Escape and returns focus to where it was.
 */
export function SearchDialog({
  open,
  onOpenChange,
  fieldId,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** The field's id, so the shortcut can focus it while the dialog is open. */
  readonly fieldId: string
}) {
  const t = useT(["search"])
  const isApple = useIsApple()
  const status = usePagefindStatus()
  const [query, setQuery] = useState("")
  const field = useRef<HTMLInputElement>(null)
  const hasQuery = query.trim() !== ""

  useEffect(() => {
    if (open) loadPagefind()
  }, [open])

  const close = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        initialFocus={field}
        className="top-4 flex max-h-[calc(100svh-2rem)] translate-y-0 flex-col gap-0 rounded-2xl p-3 sm:top-24 sm:max-h-[calc(100svh-8rem)] sm:max-w-[620px] motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
      >
        <DialogTitle className="sr-only">{t("search.dialog")}</DialogTitle>
        <div className="flex items-center gap-2 border-b pb-2.5 pl-2">
          <SearchIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
          <label htmlFor={fieldId} className="sr-only">
            {t("search.field")}
          </label>
          <input
            ref={field}
            id={fieldId}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            placeholder={t("search.placeholder")}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-1.5 text-lg outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <DialogClose
            render={<Button variant="ghost" size="icon" />}
            aria-label={t("search.close")}
          >
            <kbd aria-hidden="true" className={KBD}>
              {t("search.escKey")}
            </kbd>
          </DialogClose>
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-3 pt-4 pb-2 text-sm leading-reading text-foreground/80">
          {/* Present from the start, so what it says later is announced. */}
          <div role="status" className="flex flex-col gap-2">
            {status === "unavailable" ? (
              <>
                <p className="font-semibold text-foreground">
                  {t("search.unavailable")}
                </p>
                <p>{t("search.unavailableHint")}</p>
                <p>
                  <Link
                    href="/contents"
                    onClick={close}
                    className="font-semibold text-foreground underline underline-offset-4"
                  >
                    {t("search.toContents")}
                  </Link>
                </p>
              </>
            ) : hasQuery && status === "loading" ? (
              <p>{t("search.loading")}</p>
            ) : null}
          </div>
          {!hasQuery && status !== "unavailable" ? (
            <div className="flex flex-col gap-2">
              <p>{t("search.hint")}</p>
              <p className="text-muted-foreground">
                {t("search.shortcutHint", {
                  key: isApple ? t("search.keyApple") : t("search.keyOther"),
                })}
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
