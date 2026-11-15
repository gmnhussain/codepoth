import type {
  ContentGraph,
  GraphLesson,
  GraphTopic,
} from "@workspace/content/graph"
import { cn } from "@workspace/ui/lib/utils"

import { LessonNavLink } from "@/components/lesson/lesson-nav-link"
import { NAV_ROW_HEIGHT } from "@/components/lesson/nav-row-height"
import { ProgressCount } from "@/components/lesson/progress-count"

/** The current topic's groups (current group open) or its loose lessons. */
export function TopicLessons({
  graph,
  topic,
  current,
}: {
  readonly graph: ContentGraph
  readonly topic: GraphTopic
  readonly current: GraphLesson
}) {
  return (
    <div className="mt-2 flex flex-col gap-1">
      {topic.entries.map((entry) => {
        if (entry.kind === "lesson") {
          const lesson = graph.lessonById.get(entry.lessonId)
          return lesson === undefined ? null : (
            <ul key={entry.lessonId}>
              <LessonNavLink lesson={lesson} currentId={current.id} />
            </ul>
          )
        }
        const group = graph.groupByKey.get(entry.groupKey)
        if (group === undefined) return null
        return (
          <details
            key={group.key}
            open={group.key === current.groupKey}
            className="group"
          >
            <summary
              className={cn(
                NAV_ROW_HEIGHT,
                "flex cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted"
              )}
            >
              <span className="min-w-0 flex-1">{group.title}</span>
              <ProgressCount lessonIds={group.lessonIds} hasCheck />
            </summary>
            <ul className="ms-3 border-s ps-2">
              {group.lessonIds.map((id) => {
                const lesson = graph.lessonById.get(id)
                return lesson === undefined ? null : (
                  <LessonNavLink
                    key={id}
                    lesson={lesson}
                    currentId={current.id}
                  />
                )
              })}
            </ul>
          </details>
        )
      })}
    </div>
  )
}
