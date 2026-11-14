import type { ContentGraph, GraphLesson, GraphTopic } from "./graph"

/** URL segments of a lesson page: `/learn/[track]/[topic]/[lesson]` (ADR-0006). */
export type LessonRouteParams = {
  readonly track: string
  readonly topic: string
  readonly lesson: string
}

/** Topic folder name from a topic key (`frontend/react` → `react`). */
function topicSlugOf(topicKey: string): string {
  return topicKey.slice(topicKey.indexOf("/") + 1)
}

/** Params for every lesson page in this build (drafts only when included). */
export function lessonRouteParams(graph: ContentGraph): LessonRouteParams[] {
  return [...graph.lessonById.values()].map((lesson) => ({
    track: lesson.track,
    topic: topicSlugOf(lesson.topicKey),
    lesson: lesson.slug,
  }))
}

/** The lesson at these URL segments, or undefined. */
export function findLesson(
  graph: ContentGraph,
  params: LessonRouteParams
): GraphLesson | undefined {
  const topicKey = `${params.track}/${params.topic}`
  for (const lesson of graph.lessonById.values()) {
    if (lesson.topicKey === topicKey && lesson.slug === params.lesson) {
      return lesson
    }
  }
  return undefined
}

/** 1-based position of a topic on a track, or undefined if the track does not pass it. */
export function topicPositionOn(
  graph: ContentGraph,
  trackId: string,
  topic: GraphTopic
): number | undefined {
  const index =
    graph.tracks
      .find((track) => track.id === trackId)
      ?.topicKeys.indexOf(topic.key) ?? -1
  return index === -1 ? undefined : index + 1
}
