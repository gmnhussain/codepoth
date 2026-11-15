"use client"

import { useState } from "react"
import { BookmarkIcon, CheckIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import { markDone, setBookmark, unmarkDone } from "@/lib/progress/operations"
import type { Progress } from "@/lib/progress/progress.schema"
import { lessonState } from "@/lib/progress/selectors"
import { updateProgress, useProgress } from "@/lib/progress-store.client"

/**
 * The lesson's bookmark and "পাঠ শেষ" toggles. Each keeps a fixed label and
 * `aria-pressed` carries the state, so a screen reader announces it once;
 * the eye sees a filled bookmark or the primary style. Both render unpressed
 * on the server and change in place once the reader's progress is read. If
 * saving fails (storage blocked or full) the button stays as it was and a
 * status line says so.
 */
export function LessonActions({ lessonId }: { readonly lessonId: string }) {
  const t = useT(["lesson"])
  const progress = useProgress()
  const isDone = lessonState(progress, lessonId) === "done"
  const isBookmarked = Object.hasOwn(progress.bookmarks, lessonId)
  const [hasFailed, setHasFailed] = useState(false)

  const save = (operation: (current: Progress) => Progress): void => {
    void updateProgress(operation).then((isSaved) => {
      setHasFailed(!isSaved)
    })
  }

  return (
    <div className="flex flex-col items-end">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={isBookmarked}
          onClick={() => {
            save((current) =>
              setBookmark(current, lessonId, !isBookmarked, new Date())
            )
          }}
        >
          <BookmarkIcon
            aria-hidden="true"
            className={cn(isBookmarked && "fill-current")}
          />
          {t("lesson.bookmark")}
        </Button>
        <Button
          variant={isDone ? "default" : "outline"}
          size="sm"
          aria-pressed={isDone}
          onClick={() => {
            save((current) =>
              isDone
                ? unmarkDone(current, lessonId)
                : markDone(current, lessonId, new Date())
            )
          }}
        >
          <CheckIcon aria-hidden="true" />
          {t("lesson.markDone")}
        </Button>
      </div>
      {/* Always in the page, so the message is announced when it appears. */}
      <p
        role="status"
        className={cn("text-end text-sm text-destructive", hasFailed && "mt-2")}
      >
        {hasFailed ? t("lesson.saveFailed") : null}
      </p>
    </div>
  )
}
