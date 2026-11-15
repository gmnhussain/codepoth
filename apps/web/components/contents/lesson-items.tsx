import { t } from "@workspace/config/t"
import type { GraphLesson } from "@workspace/content/graph"
import { lessonSearchText } from "@workspace/content/search"

import { StoppedHere } from "@/components/contents/stopped-here"
import { LessonStateIcon } from "@/components/lesson/lesson-state-icon"
import { LessonRow } from "@/components/lesson-row"

/**
 * A topic's or group's lessons on the contents page, each with the reader's
 * state mark and "এখানে থেমেছিলে" on the last-read one. Each item carries
 * its id and searchable text for the contents controls' search and status
 * filter (contents-controls.tsx); groups, topics and tracks are hidden when
 * none of their lessons match.
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
          data-lesson-id={lesson.id}
          data-lesson-search={lessonSearchText(
            lesson.title,
            groupTitle,
            topicTitle
          )}
        >
          <LessonRow
            t={t}
            lesson={lesson}
            number={numberOf(lesson)}
            className="min-h-11 gap-3 rounded-lg px-3 py-2 sm:gap-4"
            numberClassName="hidden w-14 text-xs sm:block"
            leading={<LessonStateIcon lessonId={lesson.id} />}
            trailing={<StoppedHere lessonId={lesson.id} />}
          />
        </li>
      ))}
    </ol>
  )
}
