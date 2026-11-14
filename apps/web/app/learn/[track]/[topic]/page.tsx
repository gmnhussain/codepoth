import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { formatList, formatTwoDigits } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { getContentGraph } from "@workspace/content/content"
import type { ContentGraph, GraphTopic } from "@workspace/content/graph"
import type { TopicRouteParams } from "@workspace/content/routes"
import {
  findTopic,
  groupAnchorOf,
  nextTopicOn,
  roadmapTrackUrl,
  topicPositionOn,
  topicRouteParams,
} from "@workspace/content/routes"
import { buttonVariants } from "@workspace/ui/components/button"

import { Chip } from "@/components/chip"
import { LessonList } from "@/components/topic/lesson-list"
import { TopicName } from "@/components/topic/topic-name"
import { TrackStrip } from "@/components/topic/track-strip"
import { totalTimeLabel } from "@/lib/duration"
import { buildPageMetadata } from "@/lib/metadata"

const CRUMB_LINK =
  "underline decoration-foreground/30 underline-offset-4 hover:text-foreground"

type TopicPageProps = {
  readonly params: Promise<TopicRouteParams>
}

// Only topics with a published lesson get a page (ADR-0009); others are 404.
export const dynamicParams = false

export function generateStaticParams(): TopicRouteParams[] {
  return topicRouteParams(getContentGraph())
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const topic = findTopic(getContentGraph(), await params)
  if (topic === undefined) return {}
  return buildPageMetadata({
    title: topic.title,
    description: topic.description,
    path: topic.url,
  })
}

/** A card for a related topic (prerequisite or next on the track). */
function TopicCard({
  graph,
  topic,
}: {
  readonly graph: ContentGraph
  readonly topic: GraphTopic
}) {
  const track = graph.tracks.find((item) => item.id === topic.track)
  return (
    <li
      data-track-color={track?.color}
      className="flex flex-col gap-1.5 rounded-2xl border bg-card p-5"
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden="true" className="size-2 rounded-full bg-track-dot" />
        {track?.titleEn}
      </span>
      <TopicName topic={topic} className="text-lg font-semibold" />
      <p className="text-sm leading-reading text-foreground/80">
        {topic.description}
      </p>
    </li>
  )
}

/**
 * A topic: its place on the track, what it covers, where to start, its
 * groups and lessons, what to know first and what comes next.
 */
export default async function TopicPage({ params }: TopicPageProps) {
  const graph = getContentGraph()
  const topic = findTopic(graph, await params)
  if (topic === undefined) notFound()
  const track = graph.tracks.find((item) => item.id === topic.track)
  if (track === undefined) notFound()

  const position = topicPositionOn(graph, track.id, topic)
  const groups = topic.entries.flatMap((entry) => {
    if (entry.kind !== "group") return []
    const group = graph.groupByKey.get(entry.groupKey)
    return group === undefined ? [] : [group]
  })
  const looseLessonIds = topic.entries.flatMap((entry) =>
    entry.kind === "lesson" ? [entry.lessonId] : []
  )
  const firstLesson = graph.lessonById.get(topic.lessonIds[0] ?? "")
  const otherTracks = topic.trackIds
    .filter((id) => id !== track.id)
    .map((id) => graph.tracks.find((item) => item.id === id)?.titleEn)
    .filter((name): name is string => name !== undefined)
  const prerequisites = topic.prerequisites
    .map((key) => graph.topicByKey.get(key))
    .filter((item): item is GraphTopic => item !== undefined)
  const next = nextTopicOn(graph, track.id, topic.key)

  return (
    <div data-track-color={track.color}>
      <div aria-hidden="true" className="h-1.5 bg-track-dot" />
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-8">
        <header className="flex flex-col gap-6">
          <nav aria-label={t("lesson.breadcrumb")}>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Link href="/roadmap" className={CRUMB_LINK}>
                  {t("nav.roadmap")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li className="flex items-center gap-2">
                <Link href={roadmapTrackUrl(track.id)} className={CRUMB_LINK}>
                  {track.titleEn}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-foreground">
                {topic.title}
              </li>
            </ol>
          </nav>

          <TrackStrip graph={graph} track={track} currentKey={topic.key} />

          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-bold sm:text-6xl">{topic.title}</h1>
            <p className="max-w-3xl text-lg leading-reading text-foreground/80">
              {topic.description}
            </p>
            <div className="flex flex-wrap gap-2">
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
              {position === undefined ? null : (
                <Chip>{t("lesson.topicChip", { pos: position })}</Chip>
              )}
              <Chip>
                {t("topic.lessonCount", { n: topic.lessonIds.length })}
              </Chip>
              <Chip>{totalTimeLabel(topic.readingMinutes)}</Chip>
              {groups.length > 0 ? (
                <Chip>{t("topic.groupCount", { n: groups.length })}</Chip>
              ) : null}
            </div>
            {otherTracks.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("topic.interchangeNote", {
                  tracks: formatList(otherTracks),
                })}
              </p>
            ) : null}
          </div>
        </header>

        {firstLesson === undefined ? null : (
          <section
            aria-labelledby="start-heading"
            className="flex flex-col gap-4 rounded-2xl border border-track/30 bg-track/5 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <h2 id="start-heading" className="text-xl font-semibold">
                {t("topic.startHeading")}
              </h2>
              <p className="text-sm text-foreground/80">
                {t("topic.firstLesson", { lesson: firstLesson.title })}
              </p>
            </div>
            <Link href={firstLesson.url} className={buttonVariants()}>
              {t("topic.start")}
            </Link>
          </section>
        )}

        <section
          aria-labelledby="lessons-heading"
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id="lessons-heading" className="text-3xl font-semibold">
              {t("topic.lessonsHeading")}
            </h2>
            {groups.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("topic.groupSummary", {
                  groups: groups.length,
                  n: topic.lessonIds.length,
                })}
              </p>
            ) : null}
          </div>
          {groups.map((group, index) => (
            <section
              key={group.key}
              id={groupAnchorOf(group.slug)}
              aria-labelledby={`${groupAnchorOf(group.slug)}-heading`}
              className="flex scroll-mt-24 flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm text-muted-foreground">
                  {t("topic.groupKicker", { n: index + 1 })}
                </span>
                <h3
                  id={`${groupAnchorOf(group.slug)}-heading`}
                  className="text-2xl font-semibold"
                >
                  {group.title}
                </h3>
                <p className="text-sm leading-reading text-foreground/80">
                  {group.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("topic.lessonCount", { n: group.lessonIds.length })}
                  <span aria-hidden="true"> · </span>
                  {totalTimeLabel(group.readingMinutes)}
                </p>
              </div>
              <LessonList graph={graph} lessonIds={group.lessonIds} />
            </section>
          ))}
          {looseLessonIds.length > 0 ? (
            <LessonList graph={graph} lessonIds={looseLessonIds} />
          ) : null}
        </section>

        {prerequisites.length > 0 ? (
          <section
            aria-labelledby="prerequisites-heading"
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <h2 id="prerequisites-heading" className="text-2xl font-semibold">
                {t("topic.prerequisites")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("topic.prerequisitesHint")}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {prerequisites.map((item) => (
                <TopicCard key={item.key} graph={graph} topic={item} />
              ))}
            </ul>
          </section>
        ) : null}

        {next === undefined ? null : (
          <section
            aria-labelledby="after-heading"
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <h2 id="after-heading" className="text-2xl font-semibold">
                {t("topic.after")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("topic.afterHint")}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              <TopicCard graph={graph} topic={next} />
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
