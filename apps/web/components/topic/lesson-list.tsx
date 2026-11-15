import { formatNumber } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type { ContentGraph } from "@workspace/content/graph"

import { LessonStateIcon } from "@/components/lesson/lesson-state-icon"
import { LessonRow } from "@/components/lesson-row"
import { LessonRowStatus } from "@/components/topic/lesson-row-status"

/**
 * A topic's or group's lessons in order, as a card of rows, each with the
 * reader's state: a mark (hidden from screen readers) and the state in
 * words, or "এখান থেকে" on the lesson to continue with.
 */
export function LessonList({
  graph,
  lessonIds,
  topicLessonIds,
}: {
  readonly graph: ContentGraph
  readonly lessonIds: readonly string[]
  /** All the topic's lessons in order, to find the one to continue with. */
  readonly topicLessonIds: readonly string[]
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
              className="min-h-12 gap-3 px-4 py-2.5 sm:gap-4"
              numberClassName="w-6 text-end"
              leading={<LessonStateIcon lessonId={id} isDecorative />}
              trailing={
                <LessonRowStatus
                  lessonId={id}
                  topicLessonIds={topicLessonIds}
                />
              }
            />
          </li>
        )
      })}
    </ol>
  )
}
