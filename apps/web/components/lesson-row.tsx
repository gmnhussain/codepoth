import type { ReactNode } from "react"
import Link from "next/link"

import type { Translate } from "@workspace/config/translate"
import type { GraphLesson } from "@workspace/content/graph"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A lesson in a numbered list: number, title (the link) and minutes.
 * Its accessible name is "title, N মিনিট": the number is hidden (the
 * surrounding <ol> gives the order) and "মি" is spelled out for screen
 * readers (design.md#topic-page); a `trailing` state in words joins the
 * name after the title. Rendered on the server and in the roadmap island,
 * so the caller passes its `t` (ADR-0013).
 */
export function LessonRow({
  t,
  lesson,
  number,
  className,
  numberClassName,
  leading,
  trailing,
}: {
  readonly t: Translate<"topic">
  readonly lesson: Pick<GraphLesson, "url" | "title" | "readingMinutes">
  readonly number: string
  readonly className?: string
  readonly numberClassName?: string
  /** Before the number, e.g. the reader's state mark. */
  readonly leading?: ReactNode
  /** After the title, e.g. the reader's state in words. */
  readonly trailing?: ReactNode
}) {
  return (
    <Link
      href={lesson.url}
      className={cn("flex items-center gap-4 hover:bg-muted", className)}
    >
      {leading}
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
      {trailing}
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
