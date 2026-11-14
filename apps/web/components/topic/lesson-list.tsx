import { formatNumber } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type { ContentGraph } from "@workspace/content/graph"

import { LessonRow } from "@/components/lesson-row"

/**
 * A topic's or group's lessons in order, as a card of rows.
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
            <LessonRow
              t={t}
              lesson={lesson}
              number={formatNumber(
                lesson.numberInGroup ?? lesson.numberInTopic
              )}
              className="min-h-12 px-4 py-2.5"
              numberClassName="w-6 text-end"
            />
          </li>
        )
      })}
    </ol>
  )
}
