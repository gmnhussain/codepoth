import { formatList } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type { ContentGraph, GraphLesson } from "@workspace/content/graph"
import { cn } from "@workspace/ui/lib/utils"

import { NAV_ROW_HEIGHT } from "@/components/lesson/nav-row-height"
import { ProgressCount } from "@/components/lesson/progress-count"
import { TopicLessons } from "@/components/lesson/topic-lessons"
import { TopicName } from "@/components/topic/topic-name"

/**
 * The lesson's track as a vertical line of topics; the current topic opens
 * to its groups and lessons. Topics link to their pages (planned topics are
 * plain text). Each topic, group and lesson shows the reader's progress
 * (client marks over the first-visit state).
 */
export function LessonNav({
  graph,
  lesson,
}: {
  readonly graph: ContentGraph
  readonly lesson: GraphLesson
}) {
  const track = graph.tracks.find((item) => item.id === lesson.track)
  if (track === undefined) return null
  const current = graph.topicByKey.get(lesson.topicKey)
  const otherTracks =
    current?.trackIds
      .filter((id) => id !== track.id)
      .map((id) => graph.tracks.find((item) => item.id === id)?.titleEn)
      .filter((name): name is string => name !== undefined) ?? []

  return (
    // Carries its own track colour: in the drawer it renders in a portal,
    // outside the page's data-track-color wrapper.
    <nav
      data-track-color={track.color}
      aria-label={t("lesson.trackNav", { track: track.titleEn })}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-heading text-lg font-semibold">{track.titleEn}</p>
        <p className="text-sm text-muted-foreground">{track.title}</p>
      </div>
      <ol className="ms-1.5 flex flex-col gap-1 border-s-2 border-track-dot/40">
        {track.topicKeys.map((key) => {
          const topic = graph.topicByKey.get(key)
          if (topic === undefined) return null
          const isCurrent = key === lesson.topicKey
          return (
            <li key={key} className="relative ps-5">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -start-1.5 top-3.5 size-2.5 rounded-full border-2 border-track-dot bg-background",
                  isCurrent && "bg-track-dot",
                  topic.isInterchange && "ring-2 ring-foreground"
                )}
              />
              <div
                className={cn(
                  NAV_ROW_HEIGHT,
                  "flex items-center text-sm leading-snug",
                  isCurrent ? "font-semibold" : "text-foreground/80"
                )}
              >
                <TopicName
                  topic={topic}
                  className="flex flex-1 items-center self-stretch"
                />
                {topic.isInterchange ? (
                  <span className="sr-only"> {t("lesson.interchange")}</span>
                ) : null}
                {topic.lessonIds.length > 0 ? (
                  <ProgressCount lessonIds={topic.lessonIds} />
                ) : null}
              </div>
              {isCurrent ? (
                <TopicLessons graph={graph} topic={topic} current={lesson} />
              ) : null}
            </li>
          )
        })}
      </ol>
      {current?.isInterchange === true && otherTracks.length > 0 ? (
        <p className="rounded-xl bg-muted p-3 text-sm leading-reading text-foreground/80">
          {t("lesson.interchangeNote", {
            topic: current.title,
            tracks: formatList(otherTracks),
          })}
        </p>
      ) : null}
      <p className="text-xs leading-reading text-muted-foreground">
        {t("lesson.savedNote")}
      </p>
    </nav>
  )
}
