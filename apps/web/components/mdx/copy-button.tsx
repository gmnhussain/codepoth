"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { t } from "@workspace/config/t"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type CopyState = "idle" | "done" | "failed"

/** How long "কপি হয়েছে" stays before the button resets. */
const RESET_AFTER_MS = 2000

/**
 * Copies the text of the nearest `[data-copy-text]` inside the same
 * `[data-copy-root]`. Reading it from the page keeps the text out of the
 * client bundle; generated content (line numbers) is not part of innerText.
 */
export function CopyButton({
  label,
  className,
}: {
  /** Accessible name, e.g. "কোড কপি করো". */
  readonly label: string
  readonly className?: string
}) {
  const [state, setState] = useState<CopyState>("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(
    () => () => {
      clearTimeout(timer.current)
    },
    []
  )

  async function copy(button: HTMLButtonElement): Promise<void> {
    const text = button
      .closest("[data-copy-root]")
      ?.querySelector<HTMLElement>("[data-copy-text]")?.innerText
    try {
      if (text === undefined) throw new Error("Nothing to copy")
      // Blank code lines carry a space from the highlighter; drop trailing spaces.
      const clean = text
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trim()
      await navigator.clipboard.writeText(clean)
      setState("done")
    } catch {
      setState("failed")
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setState("idle")
    }, RESET_AFTER_MS)
  }

  const message =
    state === "done"
      ? t("copy.done")
      : state === "failed"
        ? t("copy.failed")
        : ""

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label={label}
        className={cn("gap-1.5", className)}
        onClick={(event) => {
          void copy(event.currentTarget)
        }}
      >
        {state === "done" ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
        <span aria-hidden="true">
          {state === "done" ? t("copy.done") : t("copy.short")}
        </span>
      </Button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  )
}
