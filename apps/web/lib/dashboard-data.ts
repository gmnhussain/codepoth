import type { TrackColor } from "@workspace/config/track-colors"
import type { ContentGraph } from "@workspace/content/graph"
import type { Roadmap } from "@workspace/content/roadmap"

import type { MapPreviewData } from "@/components/home/roadmap-preview"
import type { ResumeIndex } from "@/lib/progress/resume"
import { resumeIndexOf } from "@/lib/progress/resume-index"

/** What the Dashboard island needs, built on the server from the graph. */
export type DashboardData = {
  /**
   * Every lesson in the build: title, URL, scope (its group, or its topic)
   * and "track · topic › group". With `scopes` it is also a `ResumeIndex`,
   * so the resume card uses `resumeOf` like Home.
   */
  readonly lessons: Readonly<
    Record<string, ResumeIndex["lessons"][string] & { readonly path: string }>
  >
  /** Each scope's title and lessons, for the resume card's count. */
  readonly scopes: ResumeIndex["scopes"]
  /** Each track with its own lessons (topics homed on it). */
  readonly tracks: readonly {
    readonly id: string
    readonly title: string
    readonly color: TrackColor
    readonly lessonIds: readonly string[]
  }[]
  /** Each topic that has lessons, for "topics done" and the map's dots. */
  readonly topics: Readonly<Record<string, readonly string[]>>
  readonly map: MapPreviewData
}

/**
 * The Dashboard's data, inlined in the page rather than fetched: ADR-0014
 * ("Lesson data for Home and the Dashboard").
 */
export function dashboardDataOf(
  graph: ContentGraph,
  roadmap: Roadmap
): DashboardData {
  const index = resumeIndexOf(graph)
  const lessons: Record<string, DashboardData["lessons"][string]> = {}
  for (const lesson of graph.lessonById.values()) {
    const indexed = index.lessons[lesson.id]
    if (indexed === undefined) continue
    const track = graph.tracks.find((item) => item.id === lesson.track)
    const topic = graph.topicByKey.get(lesson.topicKey)
    const group =
      lesson.groupKey === undefined
        ? undefined
        : graph.groupByKey.get(lesson.groupKey)
    const place = [track?.titleEn, topic?.title]
      .filter((part): part is string => part !== undefined)
      .join(" · ")
    lessons[lesson.id] = {
      ...indexed,
      path: group === undefined ? place : `${place} › ${group.title}`,
    }
  }
  const topics: Record<string, readonly string[]> = {}
  for (const topic of graph.topicByKey.values()) {
    if (topic.lessonIds.length > 0) topics[topic.key] = topic.lessonIds
  }
  return {
    lessons,
    scopes: index.scopes,
    tracks: graph.tracks.map((track) => ({
      id: track.id,
      title: track.titleEn,
      color: track.color,
      lessonIds: track.topicKeys.flatMap((key) => {
        const topic = graph.topicByKey.get(key)
        return topic?.track === track.id ? topic.lessonIds : []
      }),
    })),
    topics,
    map: {
      width: roadmap.width,
      height: roadmap.height,
      tracks: roadmap.tracks.map(({ id, color, points }) => ({
        id,
        color,
        points,
      })),
      topics: roadmap.topics.map(({ key, x, y, track, isInterchange }) => ({
        key,
        x,
        y,
        track,
        isInterchange,
      })),
    },
  }
}
