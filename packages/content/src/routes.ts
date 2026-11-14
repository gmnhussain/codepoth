import type { ContentGraph, GraphLesson, GraphTopic } from "./graph"

/** URL segments of a lesson page: `/learn/[track]/[topic]/[lesson]` (ADR-0006). */
export type LessonRouteParams = {
  readonly track: string
  readonly topic: string
  readonly lesson: string
}

/** URL segments of a topic page: `/learn/[track]/[topic]` (ADR-0006). */
export type TopicRouteParams = {
  readonly track: string
  readonly topic: string
}

/** Topic folder name from a topic key (`frontend/react` → `react`). */
function topicSlugOf(topicKey: string): string {
  return topicKey.slice(topicKey.indexOf("/") + 1)
}

/** Params for every topic page: topics with at least one lesson in this build (ADR-0009). */
export function topicRouteParams(graph: ContentGraph): TopicRouteParams[] {
  return [...graph.topicByKey.values()]
    .filter((topic) => topic.hasPage)
    .map((topic) => ({ track: topic.track, topic: topic.slug }))
}

/** The topic at these URL segments if it has a page, or undefined. */
export function findTopic(
  graph: ContentGraph,
  params: TopicRouteParams
): GraphTopic | undefined {
  const topic = graph.topicByKey.get(`${params.track}/${params.topic}`)
  return topic?.hasPage === true ? topic : undefined
}

/** The topic after `topicKey` on a track, or undefined at the end of the line. */
export function nextTopicOn(
  graph: ContentGraph,
  trackId: string,
  topicKey: string
): GraphTopic | undefined {
  const keys =
    graph.tracks.find((track) => track.id === trackId)?.topicKeys ?? []
  const next = keys[keys.indexOf(topicKey) + 1]
  return keys.includes(topicKey) && next !== undefined
    ? graph.topicByKey.get(next)
    : undefined
}

/** Id of a track's section on the contents page, the target of `#track-…` links. */
export function trackAnchorOf(trackId: string): string {
  return `track-${trackId}`
}

/** Id of a group's section on its topic page, the target of `#group-…` links. */
export function groupAnchorOf(groupSlug: string): string {
  return `group-${groupSlug}`
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
