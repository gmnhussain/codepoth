"use client"

import { useId, useRef, useState } from "react"
import { UploadIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

import { useDataMessage } from "@/components/dashboard/data-message"
import { useT } from "@/lib/labels-context"
import { mergeProgress } from "@/lib/progress/merge"
import type { Progress } from "@/lib/progress/progress.schema"
import { lastSaved } from "@/lib/progress/selectors"
import type { ImportError } from "@/lib/progress/transfer"
import { updateProgress, useProgress } from "@/lib/progress-store.client"

/** The message for each reason an import file is refused. */
const ERROR_LABEL = {
  "too-large": "dashboard.importTooLarge",
  "not-json": "dashboard.importNotJson",
  "wrong-format": "dashboard.importWrongFormat",
  "unsupported-version": "dashboard.importUnsupportedVersion",
  "invalid-data": "dashboard.importInvalidData",
} as const satisfies Record<ImportError, `dashboard.${string}`>

const BYTES_PER_MB = 1024 * 1024

/**
 * Imports an exported progress file: a button (the data card) or a link-
 * styled button (the empty state) opens the file picker. The file is
 * checked before anything changes (ADR-0007, ADR-0014): over the size limit
 * it is not read at all, then the whole file is validated, and each failure
 * gets its own message, leaving the current progress as it was. With
 * progress already here, a dialog asks to merge (the default) or replace;
 * with none, the file simply becomes the progress. The checks load with the
 * file, not with the page.
 */
export function ImportControl({
  variant,
  focusAfterImport,
}: {
  readonly variant: "button" | "link"
  /** Where focus goes once the import has worked (the trigger may be gone). */
  readonly focusAfterImport: string
}) {
  const t = useT(["dashboard"])
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const progress = useProgress()
  const message = useDataMessage()
  const [pending, setPending] = useState<
    { readonly data: Progress; readonly name: string } | undefined
  >(undefined)

  const apply = (data: Progress, name: string, mode: "merge" | "replace") => {
    void updateProgress((current) =>
      mode === "merge" ? mergeProgress(current, data, new Date()) : data
    ).then((isSaved) => {
      message.show(
        isSaved
          ? t("dashboard.imported", { file: `“${name}”` })
          : t("dashboard.saveFailed")
      )
      if (isSaved) message.focusLater(focusAfterImport)
    })
  }

  const read = async (file: File) => {
    const transfer = await import("@/lib/progress/transfer")
    const refuse = (error: ImportError) => {
      const reason = t(ERROR_LABEL[error], {
        n: Math.round(transfer.MAX_IMPORT_BYTES / BYTES_PER_MB),
      })
      message.show(`${reason} ${t("dashboard.importUnchanged")}`)
    }
    const sizeError = transfer.checkImportSize(file.size)
    if (sizeError !== undefined) {
      refuse(sizeError)
      return
    }
    const result = transfer.parseImport(await file.text(), new Date())
    if (!result.ok) {
      refuse(result.error)
      return
    }
    if (lastSaved(progress) === undefined) {
      apply(result.data, file.name, "replace")
    } else {
      setPending({ data: result.data, name: file.name })
    }
  }

  return (
    <>
      <label htmlFor={inputId} className="sr-only">
        {t("dashboard.importFile")}
      </label>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept="application/json,.json"
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Cleared so choosing the same file again still fires a change.
          event.target.value = ""
          if (file !== undefined) void read(file)
        }}
      />
      <Button
        variant={variant === "link" ? "link" : "outline"}
        className={cn(variant === "link" && "h-11 px-0")}
        onClick={() => {
          input.current?.click()
        }}
      >
        {variant === "link" ? null : <UploadIcon aria-hidden="true" />}
        {variant === "link" ? t("dashboard.importLink") : t("dashboard.import")}
      </Button>
      <Dialog
        open={pending !== undefined}
        onOpenChange={(open) => {
          if (!open) setPending(undefined)
        }}
      >
        {/* No corner close button: its label is generated English; the
            dialog's own "বাতিল" and Escape close it. */}
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("dashboard.importTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.importText")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {(
              [
                ["merge", "dashboard.importMerge", "dashboard.importMergeHint"],
                [
                  "replace",
                  "dashboard.importReplace",
                  "dashboard.importReplaceHint",
                ],
              ] as const
            ).map(([mode, label, hint]) => (
              <Button
                key={mode}
                variant={mode === "merge" ? "default" : "outline"}
                className="h-auto min-h-14 flex-col items-start gap-0.5 py-2 text-start whitespace-normal"
                onClick={() => {
                  if (pending !== undefined) {
                    apply(pending.data, pending.name, mode)
                  }
                  setPending(undefined)
                }}
              >
                <span className="font-semibold">{t(label)}</span>
                <span className="text-xs font-normal opacity-80">
                  {t(hint)}
                </span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setPending(undefined)
              }}
            >
              {t("dashboard.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
