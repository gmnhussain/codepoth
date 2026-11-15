import Link from "next/link"

import { t } from "@workspace/config/t"
import type { ContentGraph, Neighbour } from "@workspace/content/graph"

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

/** The previous or next lesson as a card, noting a new group or topic. */
export function PagerCard({
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
