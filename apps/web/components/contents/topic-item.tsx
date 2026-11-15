import { ChevronRightIcon } from "lucide-react"

import { formatList, formatNumber } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type {
  ContentGraph,
  GraphLesson,
  GraphTopic,
  GraphTrack,
} from "@workspace/content/graph"
import { trackAnchorOf } from "@workspace/content/routes"
import { cn } from "@workspace/ui/lib/utils"

import { LessonItems } from "@/components/contents/lesson-items"
import { SUMMARY_ROW } from "@/components/contents/summary-class"
import { ProgressCount } from "@/components/lesson/progress-count"
import { GroupStatus } from "@/components/topic/group-status"
import { TopicName } from "@/components/topic/topic-name"

/** A topic name as a 44px target. */
const TOPIC_LINK = "inline-flex min-h-11 items-center"

function lessonsOf(graph: ContentGraph, ids: readonly string[]) {
  return ids.flatMap((id) => {
    const lesson = graph.lessonById.get(id)
    return lesson === undefined ? [] : [lesson]
  })
}

/** One topic on a track: name, position, counts, then its groups or lessons. */
export function TopicItem({
  graph,
  track,
  topic,
  position,
}: {
  readonly graph: ContentGraph
  readonly track: GraphTrack
  readonly topic: GraphTopic
  readonly position: number
}) {
  const positionText = `${formatNumber(position)}/${formatNumber(track.topicKeys.length)}`
  const dot = (
    <span
      aria-hidden="true"
      className={cn(
        "absolute -start-2.5 top-3 size-4 rounded-full border-4 border-track-dot bg-background",
        topic.isInterchange && "ring-2 ring-foreground"
      )}
    />
  )

  // A topic whose home is another track: its lessons are listed there.
  if (topic.track !== track.id) {
    const home = graph.tracks.find((item) => item.id === topic.track)
    return (
      <li data-filter-referenced="" className="relative ps-6">
        {dot}
        <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-lg font-semibold">
            <TopicName topic={topic} className={TOPIC_LINK} />
          </h3>
          <span
            aria-hidden="true"
            className="font-mono text-xs text-muted-foreground"
          >
            {positionText}
          </span>
          {home === undefined ? null : (
            // A plain in-page link, so `hashchange` fires and the island
            // opens the target track (contents-controls.tsx).
            <a
              href={`#${trackAnchorOf(home.id)}`}
              className="inline-flex min-h-11 items-center text-sm text-foreground/80 underline decoration-foreground/30 underline-offset-4 hover:text-foreground"
            >
              {t("contents.lessonsElsewhere", { track: home.titleEn })}
            </a>
          )}
        </div>
      </li>
    )
  }

  const otherTracks = topic.trackIds
    .filter((id) => id !== track.id)
    .map((id) => graph.tracks.find((item) => item.id === id)?.titleEn)
    .filter((name): name is string => name !== undefined)
  const numberOf = (lesson: GraphLesson) =>
    [track.number, position, lesson.numberInTopic].map(formatNumber).join(".")

  return (
    <li data-filter-topic="" className="relative ps-6">
      {dot}
      <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold">
          <TopicName topic={topic} className={TOPIC_LINK} />
        </h3>
        <span
          aria-hidden="true"
          className="font-mono text-xs text-muted-foreground"
        >
          {positionText}
        </span>
        {topic.lessonIds.length > 0 ? (
          <span className="text-sm text-muted-foreground">
            {t("topic.lessonCount", { n: topic.lessonIds.length })}
          </span>
        ) : null}
        {otherTracks.length > 0 ? (
          <span className="rounded-full border px-2.5 text-xs leading-relaxed text-foreground/80">
            {t("contents.interchangeChip", { tracks: formatList(otherTracks) })}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 pb-2">
        {topic.entries.map((entry) => {
          if (entry.kind === "lesson") return null
          const group = graph.groupByKey.get(entry.groupKey)
          if (group === undefined || group.lessonIds.length === 0) return null
          return (
            <details
              key={group.key}
              data-filter-group=""
              className="group/lessons rounded-xl border bg-card"
            >
              <summary
                className={cn(
                  SUMMARY_ROW,
                  "min-h-11 gap-2 rounded-xl px-3 hover:bg-muted"
                )}
              >
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground group-open/lessons:rotate-90"
                />
                <h4 className="flex-1 font-heading font-semibold">
                  {group.title}
                </h4>
                <GroupStatus
                  lessonIds={group.lessonIds}
                  topicLessonIds={topic.lessonIds}
                />
                <ProgressCount lessonIds={group.lessonIds} />
              </summary>
              <div className="px-1 pb-2">
                <LessonItems
                  lessons={lessonsOf(graph, group.lessonIds)}
                  numberOf={numberOf}
                  groupTitle={group.title}
                  topicTitle={topic.title}
                />
              </div>
            </details>
          )
        })}
        <LessonItems
          lessons={lessonsOf(
            graph,
            topic.entries.flatMap((entry) =>
              entry.kind === "lesson" ? [entry.lessonId] : []
            )
          )}
          numberOf={numberOf}
          topicTitle={topic.title}
        />
      </div>
    </li>
  )
}
