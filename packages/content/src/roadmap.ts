import type { TrackColor } from "@workspace/config/track-colors"

import type { ContentGraph, GraphLesson } from "./graph"
import type { MapData } from "./schemas/map.schema"
import { matchesQuery, normalizeForSearch } from "./search"

/**
 * The roadmap page's data: everything the map and its topic panel show,
 * small and serialisable so one client island can render it
 * (docs/design.md#roadmap-page).
 */

export type RoadmapLesson = {
  readonly id: string
  readonly title: string
  readonly url: string
  readonly readingMinutes: number
}

export type RoadmapTrack = {
  readonly id: string
  readonly number: number
  readonly title: string
  readonly titleEn: string
  readonly color: TrackColor
  /** Polyline points from `map.json`, e.g. "400,100 400,440". */
  readonly points: string
  readonly topicKeys: readonly string[]
}

export type RoadmapTopic = {
  readonly key: string
  readonly title: string
  readonly description: string
  /** Home track. */
  readonly track: string
  /** Every track that passes the topic, home first. */
  readonly trackIds: readonly string[]
  readonly x: number
  readonly y: number
  readonly label: MapData["topics"][string]["label"]
  readonly isStart: boolean
  readonly isInterchange: boolean
  readonly hasPage: boolean
  readonly url: string
  readonly readingMinutes: number
  readonly lessonCount: number
  readonly groups: readonly {
    readonly key: string
    readonly title: string
    readonly lessons: readonly RoadmapLesson[]
  }[]
  /** Lessons outside any group, in order. */
  readonly lessons: readonly RoadmapLesson[]
  /** Normalised text the topic search matches against. */
  readonly search: string
}

export type Roadmap = {
  readonly width: number
  readonly height: number
  readonly tracks: readonly RoadmapTrack[]
  /** Topics on the map, in track order (the keyboard order on the map). */
  readonly topics: readonly RoadmapTopic[]
}

function toLesson(lesson: GraphLesson): RoadmapLesson {
  return {
    id: lesson.id,
    title: lesson.title,
    url: lesson.url,
    readingMinutes: lesson.readingMinutes,
  }
}

function lessonsOf(
  graph: ContentGraph,
  ids: readonly string[]
): RoadmapLesson[] {
  return ids.flatMap((id) => {
    const lesson = graph.lessonById.get(id)
    return lesson === undefined ? [] : [toLesson(lesson)]
  })
}

/** The roadmap from the content graph and `map.json`. */
export function buildRoadmap(graph: ContentGraph): Roadmap {
  const { map } = graph
  const tracks = graph.tracks.flatMap((track) => {
    const points = map.lines[track.id]
    return points === undefined
      ? []
      : [
          {
            id: track.id,
            number: track.number,
            title: track.title,
            titleEn: track.titleEn,
            color: track.color,
            points,
            topicKeys: track.topicKeys,
          },
        ]
  })

  const seen = new Set<string>()
  const topics: RoadmapTopic[] = []
  for (const track of graph.tracks) {
    for (const key of track.topicKeys) {
      const topic = graph.topicByKey.get(key)
      const position = map.topics[key]
      if (seen.has(key) || topic === undefined || position === undefined) {
        continue
      }
      seen.add(key)
      topics.push({
        key,
        title: topic.title,
        description: topic.description,
        track: topic.track,
        trackIds: topic.trackIds,
        x: position.x,
        y: position.y,
        label: position.label,
        isStart: topic.isStart,
        isInterchange: topic.isInterchange,
        hasPage: topic.hasPage,
        url: topic.url,
        readingMinutes: topic.readingMinutes,
        lessonCount: topic.lessonIds.length,
        groups: topic.entries.flatMap((entry) => {
          if (entry.kind !== "group") return []
          const group = graph.groupByKey.get(entry.groupKey)
          return group === undefined
            ? []
            : [
                {
                  key: group.key,
                  title: group.title,
                  lessons: lessonsOf(graph, group.lessonIds),
                },
              ]
        }),
        lessons: lessonsOf(
          graph,
          topic.entries.flatMap((entry) =>
            entry.kind === "lesson" ? [entry.lessonId] : []
          )
        ),
        search: normalizeForSearch(`${topic.title} ${topic.titleEn ?? ""}`),
      })
    }
  }

  return { width: map.width, height: map.height, tracks, topics }
}

/** What narrows the map: a focused track, start topics only, a search. */
export type RoadmapFilter = {
  readonly track?: string | undefined
  readonly startOnly?: boolean | undefined
  readonly query?: string | undefined
}

/** Whether a topic stays bright under the filter (others are dimmed). */
export function isTopicVisible(
  topic: RoadmapTopic,
  filter: RoadmapFilter
): boolean {
  if (filter.track !== undefined && !topic.trackIds.includes(filter.track)) {
    return false
  }
  if (filter.startOnly === true && !topic.isStart) return false
  return matchesQuery(topic.search, filter.query ?? "")
}

/** The topics before and after `key` on a track, for the panel's ← / → . */
export function topicNeighbours(
  roadmap: Roadmap,
  trackId: string,
  key: string
): { previous: string | undefined; next: string | undefined } {
  const keys =
    roadmap.tracks.find((track) => track.id === trackId)?.topicKeys ?? []
  const index = keys.indexOf(key)
  if (index === -1) return { previous: undefined, next: undefined }
  return { previous: keys[index - 1], next: keys[index + 1] }
}
