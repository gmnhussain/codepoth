import Link from "next/link"

import { t } from "@workspace/config/t"
import type { GraphLesson } from "@workspace/content/graph"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A lesson in a numbered list: number, title (the link) and minutes.
 * Its accessible name is "title, N মিনিট": the number is hidden (the
 * surrounding <ol> gives the order) and "মি" is spelled out for screen
 * readers (design.md#topic-page).
 */
export function LessonRow({
  lesson,
  number,
  className,
  numberClassName,
}: {
  readonly lesson: Pick<GraphLesson, "url" | "title" | "readingMinutes">
  readonly number: string
  readonly className?: string
  readonly numberClassName?: string
}) {
  return (
    <Link
      href={lesson.url}
      className={cn("flex items-center gap-4 hover:bg-muted", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 font-mono text-sm text-muted-foreground",
          numberClassName
        )}
      >
        {number}
      </span>
      <span className="flex-1 leading-snug font-medium">{lesson.title}</span>
      <span className="shrink-0 text-sm text-muted-foreground">
        <span aria-hidden="true">
          {t("topic.minutesShort", { n: lesson.readingMinutes })}
        </span>
        <span className="sr-only">
          {t("topic.minutesSr", { n: lesson.readingMinutes })}
        </span>
      </span>
    </Link>
  )
}
