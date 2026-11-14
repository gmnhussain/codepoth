import type { GraphLesson } from "@workspace/content/graph"
import { lessonSearchText } from "@workspace/content/search"

import { LessonRow } from "@/components/lesson-row"

/**
 * A topic's or group's lessons on the contents page. Each item carries the
 * searchable text the contents controls read (contents-controls.tsx);
 * groups, topics and tracks are hidden when none of their lessons match.
 */
export function LessonItems({
  lessons,
  numberOf,
  groupTitle,
  topicTitle,
}: {
  readonly lessons: readonly GraphLesson[]
  readonly numberOf: (lesson: GraphLesson) => string
  readonly groupTitle?: string | undefined
  readonly topicTitle: string
}) {
  return (
    <ol className="flex flex-col">
      {lessons.map((lesson) => (
        <li
          key={lesson.id}
          data-lesson-search={lessonSearchText(
            lesson.title,
            groupTitle,
            topicTitle
          )}
        >
          <LessonRow
            lesson={lesson}
            number={numberOf(lesson)}
            className="min-h-11 rounded-lg px-3 py-2"
            numberClassName="hidden w-14 text-xs sm:block"
          />
        </li>
      ))}
    </ol>
  )
}
