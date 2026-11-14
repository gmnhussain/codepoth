import Link from "next/link"

import { formatTwoDigits } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { NEXT_SECTION_NUMBER } from "@workspace/content/blocks"
import type { ContentGraph, Neighbour } from "@workspace/content/graph"
import { neighboursOf } from "@workspace/content/graph"

import { PAGER_HEADING_ID } from "@/components/lesson/toc-items"

/** "পরের গ্রুপ: Hooks" or "আগের স্টেশন: React" when the neighbour starts a new group or topic. */
function boundaryNote(
  graph: ContentGraph,
  neighbour: Neighbour,
  direction: "prev" | "next"
): string | undefined {
  const lesson = graph.lessonById.get(neighbour.lessonId)
  if (lesson === undefined) return undefined
  if (neighbour.isOtherTopic) {
    const topic = graph.topicByKey.get(lesson.topicKey)
    if (topic === undefined) return undefined
    return direction === "prev"
      ? t("lesson.prevTopic", { topic: topic.title })
      : t("lesson.nextTopic", { topic: topic.title })
  }
  if (neighbour.isOtherGroup && lesson.groupKey !== undefined) {
    const group = graph.groupByKey.get(lesson.groupKey)
    if (group === undefined) return undefined
    return direction === "prev"
      ? t("lesson.prevGroup", { group: group.title })
      : t("lesson.nextGroup", { group: group.title })
  }
  return undefined
}

function PagerCard({
  graph,
  neighbour,
  direction,
}: {
  readonly graph: ContentGraph
  readonly neighbour: Neighbour
  readonly direction: "prev" | "next"
}) {
  const lesson = graph.lessonById.get(neighbour.lessonId)
  if (lesson === undefined) return null
  const note = boundaryNote(graph, neighbour, direction)
  return (
    <Link
      href={lesson.url}
      rel={direction}
      className={
        direction === "next"
          ? "flex min-h-24 flex-col gap-1.5 rounded-2xl border bg-card p-5 text-end hover:border-input sm:col-start-2"
          : "flex min-h-24 flex-col gap-1.5 rounded-2xl border bg-card p-5 hover:border-input"
      }
    >
      <span className="text-sm text-muted-foreground">
        {direction === "prev" ? t("lesson.prevLesson") : t("lesson.nextLesson")}
      </span>
      <span className="text-lg leading-snug font-semibold">{lesson.title}</span>
      {note === undefined ? null : (
        <span className="text-sm text-muted-foreground">{note}</span>
      )}
    </Link>
  )
}

/**
 * Section ০৭: the previous and next lesson along the lesson's home track
 * (computed at build time, `neighboursOf`), noting a new group or topic.
 */
export function LessonPager({
  graph,
  lessonId,
}: {
  readonly graph: ContentGraph
  readonly lessonId: string
}) {
  const { previous, next } = neighboursOf(graph, lessonId)
  if (previous === undefined && next === undefined) return null
  return (
    <section
      aria-labelledby={PAGER_HEADING_ID}
      className="flex scroll-mt-24 flex-col gap-5"
    >
      <h2
        id={PAGER_HEADING_ID}
        className="flex scroll-mt-24 items-center gap-3 text-3xl font-semibold"
      >
        <span
          aria-hidden="true"
          className="rounded-md border border-input px-2 font-mono text-sm font-medium text-muted-foreground"
        >
          {formatTwoDigits(NEXT_SECTION_NUMBER)}
        </span>
        {t("blocks.next")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {previous === undefined ? null : (
          <PagerCard graph={graph} neighbour={previous} direction="prev" />
        )}
        {next === undefined ? null : (
          <PagerCard graph={graph} neighbour={next} direction="next" />
        )}
      </div>
    </section>
  )
}
