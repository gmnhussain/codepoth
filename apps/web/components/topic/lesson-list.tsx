import Link from "next/link"

import { formatNumber } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type { ContentGraph } from "@workspace/content/graph"

/**
 * A topic's or group's lessons in order: number, title (a link) and minutes.
 * The link's accessible name is "title, N মিনিট": the number is hidden (the
 * <ol> gives the order) and "মি" is spelled out for screen readers.
 * The reader's state per lesson arrives with reader progress (Phase 3).
 */
export function LessonList({
  graph,
  lessonIds,
}: {
  readonly graph: ContentGraph
  readonly lessonIds: readonly string[]
}) {
  return (
    <ol className="flex flex-col divide-y rounded-xl border bg-card">
      {lessonIds.map((id) => {
        const lesson = graph.lessonById.get(id)
        if (lesson === undefined) return null
        return (
          <li key={id}>
            <Link
              href={lesson.url}
              className="flex min-h-12 items-center gap-4 px-4 py-2.5 hover:bg-muted"
            >
              <span
                aria-hidden="true"
                className="w-6 shrink-0 text-end font-mono text-sm text-muted-foreground"
              >
                {formatNumber(lesson.numberInGroup ?? lesson.numberInTopic)}
              </span>
              <span className="flex-1 leading-snug font-medium">
                {lesson.title}
              </span>
              <span className="shrink-0 text-sm text-muted-foreground">
                <span aria-hidden="true">
                  {t("topic.minutesShort", { n: lesson.readingMinutes })}
                </span>
                <span className="sr-only">
                  {t("topic.minutesSr", { n: lesson.readingMinutes })}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
