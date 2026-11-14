import type { ReactNode } from "react"

import {
  formatDate,
  formatNumber,
  formatTwoDigits,
} from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type { ContentGraph, GraphLesson } from "@workspace/content/graph"
import { topicPositionOn } from "@workspace/content/routes"

import { Chip } from "@/components/chip"

/**
 * Breadcrumb, position chips, title, description and the updated/reading-time
 * line. Breadcrumb items become links as the roadmap and topic pages exist
 * (conventions §2: no links to missing pages).
 */
export function LessonHeader({
  graph,
  lesson,
  navTrigger,
}: {
  readonly graph: ContentGraph
  readonly lesson: GraphLesson
  /** The track-navigation drawer button, shown beside the breadcrumb below `lg`. */
  readonly navTrigger?: ReactNode
}) {
  const track = graph.tracks.find((item) => item.id === lesson.track)
  const topic = graph.topicByKey.get(lesson.topicKey)
  const group =
    lesson.groupKey === undefined
      ? undefined
      : graph.groupByKey.get(lesson.groupKey)
  const topicPosition =
    topic === undefined
      ? undefined
      : topicPositionOn(graph, lesson.track, topic)

  const crumbs = [
    t("nav.roadmap"),
    track?.titleEn,
    topic?.title,
    group?.title,
  ].filter((crumb): crumb is string => crumb !== undefined)

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <nav aria-label={t("lesson.breadcrumb")} className="min-w-0">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {crumbs.map((crumb) => (
              <li key={crumb} className="flex items-center gap-2">
                <span>{crumb}</span>
                <span aria-hidden="true">/</span>
              </li>
            ))}
            <li aria-current="page" className="text-foreground">
              {lesson.title}
            </li>
          </ol>
        </nav>
        {navTrigger}
      </div>

      <div className="flex flex-wrap gap-2">
        {track === undefined ? null : (
          <Chip>
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-track-dot"
            />
            {t("lesson.trackChip", {
              track: track.titleEn,
              n: formatTwoDigits(track.number),
            })}
          </Chip>
        )}
        {topicPosition === undefined ? null : (
          <Chip>{t("lesson.topicChip", { pos: topicPosition })}</Chip>
        )}
        {group === undefined || lesson.numberInGroup === undefined ? (
          <Chip>{t("lesson.lessonChip", { pos: lesson.numberInTopic })}</Chip>
        ) : (
          <Chip>
            {t("lesson.groupChip", {
              group: group.title,
              pos: lesson.numberInGroup,
            })}
          </Chip>
        )}
      </div>

      <h1 className="text-4xl font-bold sm:text-5xl">{lesson.title}</h1>
      {lesson.description === undefined ? null : (
        <p className="text-lg leading-reading text-foreground/80">
          {lesson.description}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {t("lesson.updated", { date: formatDate(lesson.updated) })}
        <span aria-hidden="true"> · </span>
        {t("lesson.readingTime", { n: formatNumber(lesson.readingMinutes) })}
      </p>
    </header>
  )
}
