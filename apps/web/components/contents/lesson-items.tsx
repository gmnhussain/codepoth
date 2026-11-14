import type { GraphLesson } from "@workspace/content/graph"
import { normalizeForSearch } from "@workspace/content/search"

import { LessonRow } from "@/components/lesson-row"

/**
 * A topic's or group's lessons on the contents page. Each item carries the
 * searchable text the contents controls read (contents-controls.tsx);
 * groups, topics and tracks are hidden when none of their lessons match.
 */
export function LessonItems({
  lessons,
  numberOf,
  searchContext,
}: {
  readonly lessons: readonly GraphLesson[]
  readonly numberOf: (lesson: GraphLesson) => string
  readonly searchContext: string
}) {
  return (
    <ol className="flex flex-col">
      {lessons.map((lesson) => (
        <li
          key={lesson.id}
          data-lesson-search={normalizeForSearch(
            `${lesson.title} ${searchContext}`
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
