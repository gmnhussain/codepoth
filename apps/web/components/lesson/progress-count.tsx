"use client"

import { CheckIcon } from "lucide-react"

import { formatNumber } from "@workspace/config/format"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import { summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * "২/৩": how many of these lessons are done, read as "৩টির ২টি শেষ". With
 * `hasCheck`, a tick shows once all are done, in a slot that is always
 * there. The count is right-aligned in a box as wide as "total/total", so
 * neither the tick nor a longer number moves the row (ADR-0014).
 */
export function ProgressCount({
  lessonIds,
  hasCheck = false,
}: {
  readonly lessonIds: readonly string[]
  readonly hasCheck?: boolean
}) {
  const t = useT(["lesson"])
  const { done, total, state } = summarize(useProgress(), lessonIds)
  const widest = `${formatNumber(total)}/${formatNumber(total)}`
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground">
      {hasCheck ? (
        <CheckIcon
          aria-hidden="true"
          className={cn(
            "size-3.5 text-foreground",
            state !== "done" && "invisible"
          )}
        />
      ) : null}
      {/* The widest text sits invisible in the same grid cell to reserve its width. */}
      <span aria-hidden="true" className="grid justify-items-end tabular-nums">
        <span className="invisible col-start-1 row-start-1">{widest}</span>
        <span className="col-start-1 row-start-1">
          {formatNumber(done)}/{formatNumber(total)}
        </span>
      </span>
      <span className="sr-only">
        {t("lesson.doneOfTotal", { total, done })}
      </span>
    </span>
  )
}
