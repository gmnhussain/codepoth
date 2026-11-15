"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { XIcon } from "lucide-react"

import { formatDate, formatNumber } from "@workspace/config/format"
import { Button } from "@workspace/ui/components/button"

import { useT } from "@/lib/labels-context"
import { localDay } from "@/lib/progress/days"
import { setBookmark } from "@/lib/progress/operations"
import type { Progress } from "@/lib/progress/progress.schema"
import { bookmarksNewestFirst } from "@/lib/progress/selectors"
import { updateProgress } from "@/lib/progress-store.client"

/**
 * "বুকমার্ক": the reader's bookmarks, newest first, each with its place and
 * date and a remove button. Removing one announces it and moves focus to
 * the list's heading (the button itself is gone).
 */
export function BookmarkList({
  progress,
  lessons,
}: {
  readonly progress: Progress
  readonly lessons: Readonly<
    Record<
      string,
      { readonly title: string; readonly url: string; readonly path: string }
    >
  >
}) {
  const t = useT(["dashboard"])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [message, setMessage] = useState("")
  const items = bookmarksNewestFirst(progress, Object.keys(lessons))

  const remove = (id: string, title: string): void => {
    void updateProgress((current) =>
      setBookmark(current, id, false, new Date())
    ).then((isSaved) => {
      if (!isSaved) return
      setMessage(t("dashboard.bookmarkRemoved", { lesson: title }))
      headingRef.current?.focus()
    })
  }

  return (
    <section
      aria-labelledby="bookmarks-heading"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
    >
      <h2
        ref={headingRef}
        id="bookmarks-heading"
        tabIndex={-1}
        className="flex items-baseline gap-2 text-sm font-semibold text-muted-foreground outline-none"
      >
        {t("dashboard.bookmarks")}
        <span className="font-mono text-xs font-normal">
          {formatNumber(items.length)}
        </span>
      </h2>
      {items.length === 0 ? (
        <p className="text-foreground/80">{t("dashboard.noBookmarks")}</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {items.map((item) => {
            const lesson = lessons[item.id]
            if (lesson === undefined) return null
            return (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Link
                    href={lesson.url}
                    className="leading-snug font-medium underline-offset-4 hover:underline"
                  >
                    {lesson.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {lesson.path}
                    <span aria-hidden="true"> · </span>
                    {t("dashboard.savedOn", {
                      date: formatDate(localDay(new Date(item.at))),
                    })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    remove(item.id, lesson.title)
                  }}
                >
                  <XIcon aria-hidden="true" />
                  <span className="sr-only">
                    {t("dashboard.removeBookmark", { lesson: lesson.title })}
                  </span>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
      <p role="status" className="sr-only">
        {message}
      </p>
    </section>
  )
}
