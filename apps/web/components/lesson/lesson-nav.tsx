import Link from "next/link"

import { formatList } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type {
  ContentGraph,
  GraphLesson,
  GraphTopic,
} from "@workspace/content/graph"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 40px rows in the desktop column (mouse); 44px on touch screens and inside
 * the drawer (design.md#accessibility).
 */
const TARGET_HEIGHT =
  "min-h-10 pointer-coarse:min-h-11 in-data-[slot=sheet-content]:min-h-11"

const LESSON_LINK = `${TARGET_HEIGHT} flex items-center rounded-lg px-3 py-1.5 text-sm leading-snug text-foreground/80 hover:bg-muted hover:text-foreground aria-[current=page]:bg-track/10 aria-[current=page]:font-semibold aria-[current=page]:text-foreground`

function LessonLink({
  lesson,
  currentId,
}: {
  readonly lesson: GraphLesson
  readonly currentId: string
}) {
  return (
    <li>
      <Link
        href={lesson.url}
        className={LESSON_LINK}
        {...(lesson.id === currentId
          ? { "aria-current": "page" as const }
          : {})}
      >
        {lesson.title}
      </Link>
    </li>
  )
}

/** The current topic's groups (current group open) or its loose lessons. */
function TopicLessons({
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
              <LessonLink lesson={lesson} currentId={current.id} />
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
                TARGET_HEIGHT,
                "flex cursor-pointer items-center rounded-lg px-3 text-sm font-semibold hover:bg-muted"
              )}
            >
              {group.title}
            </summary>
            <ul className="ms-3 border-s ps-2">
              {group.lessonIds.map((id) => {
                const lesson = graph.lessonById.get(id)
                return lesson === undefined ? null : (
                  <LessonLink key={id} lesson={lesson} currentId={current.id} />
                )
              })}
            </ul>
          </details>
        )
      })}
    </div>
  )
}

/**
 * The lesson's track as a vertical line of topics; the current topic opens
 * to its groups and lessons. Topics become links when topic pages exist; the
 * reader's done/total counts arrive with reader progress (Phase 3).
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
      <ol className="ms-1.5 flex flex-col gap-3 border-s-2 border-track-dot/40">
        {track.topicKeys.map((key) => {
          const topic = graph.topicByKey.get(key)
          if (topic === undefined) return null
          const isCurrent = key === lesson.topicKey
          return (
            <li key={key} className="relative ps-5">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -start-1.5 top-2 size-2.5 rounded-full border-2 border-track-dot bg-background",
                  isCurrent && "bg-track-dot",
                  topic.isInterchange && "ring-2 ring-foreground"
                )}
              />
              <span
                className={cn(
                  "block text-sm leading-snug",
                  isCurrent ? "font-semibold" : "text-foreground/80"
                )}
              >
                {topic.title}
                {topic.isInterchange ? (
                  <span className="sr-only"> {t("lesson.interchange")}</span>
                ) : null}
              </span>
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
    </nav>
  )
}
