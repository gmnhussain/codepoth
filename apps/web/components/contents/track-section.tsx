import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

import {
  formatList,
  formatNumber,
  formatTwoDigits,
} from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type {
  ContentGraph,
  GraphLesson,
  GraphTopic,
  GraphTrack,
} from "@workspace/content/graph"
import { trackAnchorOf } from "@workspace/content/routes"
import { normalizeForSearch } from "@workspace/content/search"
import { cn } from "@workspace/ui/lib/utils"

import { LessonRow } from "@/components/lesson-row"
import { TopicName } from "@/components/topic/topic-name"

/** A topic name as a 44px target. */
const TOPIC_LINK = "inline-flex min-h-11 items-center"

const SUMMARY =
  "flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden"

/**
 * The filter attributes the contents controls read (contents-controls.tsx):
 * each lesson carries its searchable text; groups, topics and tracks are
 * hidden when none of their lessons match.
 */
function LessonItems({
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

function lessonsOf(graph: ContentGraph, ids: readonly string[]) {
  return ids.flatMap((id) => {
    const lesson = graph.lessonById.get(id)
    return lesson === undefined ? [] : [lesson]
  })
}

/** One topic on a track: name, position, counts, then its groups or lessons. */
function TopicItem({
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
                  SUMMARY,
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
                <span className="text-sm text-muted-foreground">
                  {t("topic.lessonCount", { n: group.lessonIds.length })}
                </span>
              </summary>
              <div className="px-1 pb-2">
                <LessonItems
                  lessons={lessonsOf(graph, group.lessonIds)}
                  numberOf={numberOf}
                  searchContext={`${group.title} ${topic.title}`}
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
          searchContext={topic.title}
        />
      </div>
    </li>
  )
}

/** A track on the contents page: a collapsible card of its topics in order. */
export function TrackSection({
  graph,
  track,
  defaultOpen,
}: {
  readonly graph: ContentGraph
  readonly track: GraphTrack
  readonly defaultOpen: boolean
}) {
  const anchor = trackAnchorOf(track.id)
  const ownTopics = track.topicKeys
    .map((key) => graph.topicByKey.get(key))
    .filter(
      (topic): topic is GraphTopic =>
        topic !== undefined && topic.track === track.id
    )
  const lessonCount = ownTopics.reduce(
    (sum, topic) => sum + topic.lessonIds.length,
    0
  )

  return (
    <section
      id={anchor}
      aria-labelledby={`${anchor}-heading`}
      data-filter-track=""
      data-track-color={track.color}
      className="scroll-mt-24 rounded-2xl border bg-card"
    >
      <details open={defaultOpen} className="group/track">
        <summary
          className={cn(
            SUMMARY,
            "min-h-18 gap-4 rounded-2xl px-5 py-4 hover:bg-muted/50"
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-4 border-track-dot bg-background font-mono text-sm"
          >
            {formatTwoDigits(track.number)}
          </span>
          <span className="flex flex-1 flex-col">
            <h2 id={`${anchor}-heading`} className="text-xl font-bold">
              {track.titleEn}
            </h2>
            <span className="text-sm text-muted-foreground">
              {track.title}
              <span aria-hidden="true"> · </span>
              {t("contents.trackMeta", {
                topics: ownTopics.length,
                n: lessonCount,
              })}
            </span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground group-open/track:rotate-180"
          />
        </summary>
        <div className="border-t px-5 pt-3 pb-4">
          <ol className="ms-2 flex flex-col gap-2 border-s-4 border-track-dot/50">
            {track.topicKeys.map((key, index) => {
              const topic = graph.topicByKey.get(key)
              return topic === undefined ? null : (
                <TopicItem
                  key={key}
                  graph={graph}
                  track={track}
                  topic={topic}
                  position={index + 1}
                />
              )
            })}
          </ol>
        </div>
      </details>
    </section>
  )
}
