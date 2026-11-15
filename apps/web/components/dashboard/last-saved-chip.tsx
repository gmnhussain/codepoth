"use client"

import { HardDriveIcon } from "lucide-react"

import { formatDate } from "@workspace/config/format"

import { Chip } from "@/components/chip"
import { useT } from "@/lib/labels-context"
import { localDay } from "@/lib/progress/days"
import { lastSaved } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * The header chip: "শেষ সেভ: {date}" once something is saved, otherwise
 * "এখনো কিছু সেভ হয়নি" (also the prerendered HTML). The chip sits at the
 * end of its own header row, so a different width moves nothing.
 */
export function LastSavedChip() {
  const t = useT(["dashboard"])
  const saved = lastSaved(useProgress())
  return (
    <Chip>
      <HardDriveIcon aria-hidden="true" className="size-3.5" />
      {saved === undefined
        ? t("dashboard.nothingSaved")
        : t("dashboard.lastSaved", {
            date: formatDate(localDay(new Date(saved))),
          })}
    </Chip>
  )
}
