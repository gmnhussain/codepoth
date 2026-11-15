"use client"

import { useState } from "react"
import { DownloadIcon, Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"

import { useDataMessage } from "@/components/dashboard/data-message"
import { ImportControl } from "@/components/dashboard/import-control"
import { useT } from "@/lib/labels-context"
import type { Progress } from "@/lib/progress/progress.schema"
import { clearProgress } from "@/lib/progress-store.client"

/** Where focus goes after clearing: the empty state's heading. */
const EMPTY_HEADING_ID = "empty-heading"

/** How long the export's object URL lives after the click starts the download. */
const REVOKE_DELAY_MS = 10_000

/**
 * "তোমার ডেটা": that the data stays in this browser, and export, import and
 * "সব মুছে ফেলো" (after a confirmation). Export downloads the file ADR-0007
 * describes; its builder loads on click, not with the page.
 */
export function DataSection({ progress }: { readonly progress: Progress }) {
  const t = useT(["dashboard"])
  const message = useDataMessage()
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const download = async () => {
    const transfer = await import("@/lib/progress/transfer")
    const name = `${transfer.EXPORT_FORMAT}.json`
    const file = new Blob(
      [JSON.stringify(transfer.createExport(progress, new Date()), null, 2)],
      { type: "application/json" }
    )
    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = name
    // In the document for the click, and the URL revoked on a later task:
    // revoking it at once can cancel the download in Safari and some Firefox
    // versions.
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, REVOKE_DELAY_MS)
    message.show(t("dashboard.exported", { file: name }))
  }

  return (
    <section
      aria-labelledby="data-heading"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="data-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          {t("dashboard.yourData")}
        </h2>
        <p className="font-medium">{t("dashboard.dataLocal")}</p>
        <p className="text-sm text-foreground/80">{t("dashboard.dataHint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            void download()
          }}
        >
          <DownloadIcon aria-hidden="true" />
          {t("dashboard.export")}
        </Button>
        <ImportControl variant="button" focusAfterImport="overall-heading" />
        <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger
            render={
              <Button variant="destructive">
                <Trash2Icon aria-hidden="true" />
                {t("dashboard.clearAll")}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("dashboard.confirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("dashboard.confirmText")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("dashboard.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setConfirmOpen(false)
                  const isCleared = clearProgress()
                  message.show(
                    isCleared
                      ? t("dashboard.cleared")
                      : t("dashboard.saveFailed")
                  )
                  if (isCleared) message.focusLater(EMPTY_HEADING_ID)
                }}
              >
                {t("dashboard.confirmYes")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  )
}
