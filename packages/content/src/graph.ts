import type { ContentOptions } from "./env"
import type { ContentFiles, GlossaryFile, LessonFile } from "./files"
import { lessonUrl, resolveTopicRef, topicKeyOf, topicUrl } from "./paths"
import { readingMinutesOf } from "./reading-time"
import type { MapData } from "./schemas/map.schema"
import type { StartRoutes } from "./schemas/start-routes.schema"
import type { TrackColor } from "@workspace/config/track-colors"
import { validateContent } from "./validate"

/**
 * The content tree with everything derived at build time: order, numbers,
 * interchanges, reading time, prev/next and the glossary reverse index
 * (docs/content-model.md). Lists hold keys; look items up in the maps.
 */

/** A track, in the order of `tracks/_meta.json`. */
export type GraphTrack = {
  readonly id: string
  /** 1-based position in `tracks/_meta.json`. */
  readonly number: number
  readonly title: string
  readonly titleEn: string
  readonly color: TrackColor
  /** Topics on this track in order, own and referenced. */
  readonly topicKeys: readonly string[]
}

/** A group or a lesson directly in a topic, in the topic's order. */
export type TopicEntry =
  | { readonly kind: "group"; readonly groupKey: string }
  | { readonly kind: "lesson"; readonly lessonId: string }

/** A topic, stored once under its home track. */
export type GraphTopic = {
  readonly key: string
  readonly track: string
  readonly slug: string
  readonly title: string
  readonly titleEn: string | undefined
  readonly description: string
  readonly isStart: boolean
  readonly url: string
  /** Topic keys to know first. */
  readonly prerequisites: readonly string[]
  /** Tracks that pass through the topic: the home track first, then the others in track order. */
  readonly trackIds: readonly string[]
  readonly isInterchange: boolean
  /** Groups and loose lessons in order; groups without lessons are left out. */
  readonly entries: readonly TopicEntry[]
  /** Every lesson in reading order, groups flattened. */
  readonly lessonIds: readonly string[]
  readonly readingMinutes: number
  /** False for a planned topic with no lessons yet: it gets no page (ADR-0009). */
  readonly hasPage: boolean
}

/** A group of lessons inside a topic. */
export type GraphGroup = {
  readonly key: string
  readonly topicKey: string
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly lessonIds: readonly string[]
  readonly readingMinutes: number
}

/** A lesson with its derived fields. */
export type GraphLesson = Omit<LessonFile, "location"> & {
  readonly slug: string
  readonly url: string
  readonly track: string
  readonly topicKey: string
  readonly groupKey: string | undefined
  readonly readingMinutes: number
  /** 1-based position in the topic, groups flattened. */
  readonly numberInTopic: number
  /** 1-based position in its group, if it has one. */
  readonly numberInGroup: number | undefined
}

/** A glossary entry and the lessons that list it. */
export type GraphTerm = GlossaryFile & { readonly lessonIds: readonly string[] }

/** Site-wide counts for Home. */
export type ContentStats = {
  readonly tracks: number
  readonly topics: number
  readonly lessons: number
  readonly quizQuestions: number
}

/** The whole content graph. */
export type ContentGraph = {
  readonly tracks: readonly GraphTrack[]
  readonly topicByKey: ReadonlyMap<string, GraphTopic>
  readonly groupByKey: ReadonlyMap<string, GraphGroup>
  readonly lessonById: ReadonlyMap<string, GraphLesson>
  /** Glossary entries sorted by term. */
  readonly glossary: readonly GraphTerm[]
  readonly map: MapData
  readonly startRoutes: StartRoutes
  readonly stats: ContentStats
}

/** Thrown when the content breaks a cross-file rule. */
export class ContentValidationError extends Error {
  override readonly name = "ContentValidationError"

  constructor(readonly problems: readonly string[]) {
    super(
      `Content has ${String(problems.length)} problem(s):\n- ${problems.join("\n- ")}`
    )
  }
}

function groupKeyOf(topicKey: string, group: string): string {
  return `${topicKey}/${group}`
}

function sumMinutes(
  ids: readonly string[],
  lessons: ReadonlyMap<string, GraphLesson>
): number {
  return ids.reduce(
    (total, id) => total + (lessons.get(id)?.readingMinutes ?? 0),
    0
  )
}

/**
 * Builds the graph from validated files. Assumes `validateContent` found no
 * errors; use `loadContent` to do both.
 */
export function buildContentGraph(
  files: ContentFiles,
  options: ContentOptions
): ContentGraph {
  const { map, startRoutes } = files
  if (map === undefined || startRoutes === undefined) {
    throw new ContentValidationError([
      "map.json and start-routes.json are required",
    ])
  }
  const isVisible = (item: { readonly draft: boolean }): boolean =>
    options.includeDrafts || !item.draft
  const lessons = files.lessons.filter(isVisible)
  const lessonBySlug = new Map<string, LessonFile>()
  for (const lesson of lessons) {
    const { track, topic, slug } = lesson.location
    lessonBySlug.set(`${topicKeyOf(track, topic)}/${slug}`, lesson)
  }

  // Track order and the tracks that pass through each topic.
  const trackOrder = files.tracksOrder?.order ?? []
  const trackFileById = new Map(
    files.tracks.flatMap((track) =>
      track.location.level === "track"
        ? [[track.location.track, track] as const]
        : []
    )
  )
  const tracks: GraphTrack[] = []
  const trackIdsOfTopic = new Map<string, string[]>()
  for (const [index, id] of trackOrder.entries()) {
    const file = trackFileById.get(id)
    if (file === undefined) continue
    const topicKeys = file.order.map((entry) => resolveTopicRef(entry, id).key)
    tracks.push({
      id,
      number: index + 1,
      title: file.title,
      titleEn: file.titleEn,
      color: file.color,
      topicKeys,
    })
    for (const key of topicKeys) {
      const list = trackIdsOfTopic.get(key) ?? []
      list.push(id)
      trackIdsOfTopic.set(key, list)
    }
  }

  const groupFileByKey = new Map(
    files.groups.flatMap((group) =>
      group.location.level === "group"
        ? [
            [
              groupKeyOf(
                topicKeyOf(group.location.track, group.location.topic),
                group.location.group
              ),
              group,
            ] as const,
          ]
        : []
    )
  )

  const lessonById = new Map<string, GraphLesson>()
  const groupByKey = new Map<string, GraphGroup>()
  const topicByKey = new Map<string, GraphTopic>()

  for (const topic of files.topics) {
    if (topic.location.level !== "topic") continue
    const { track, topic: slug } = topic.location
    const key = topicKeyOf(track, slug)
    const entries: TopicEntry[] = []
    const topicLessonIds: string[] = []

    const addLesson = (
      lesson: LessonFile,
      groupKey: string | undefined,
      numberInGroup: number | undefined
    ): void => {
      const { location, ...fields } = lesson
      topicLessonIds.push(lesson.id)
      lessonById.set(lesson.id, {
        ...fields,
        slug: location.slug,
        url: lessonUrl(location),
        track: location.track,
        topicKey: key,
        groupKey,
        readingMinutes: readingMinutesOf(lesson.content),
        numberInTopic: topicLessonIds.length,
        numberInGroup,
      })
    }

    for (const name of topic.order) {
      const groupFile = groupFileByKey.get(groupKeyOf(key, name))
      if (groupFile === undefined) {
        const lesson = lessonBySlug.get(`${key}/${name}`)
        if (lesson === undefined) continue
        addLesson(lesson, undefined, undefined)
        entries.push({ kind: "lesson", lessonId: lesson.id })
        continue
      }
      const groupKey = groupKeyOf(key, name)
      const groupLessonIds: string[] = []
      for (const lessonSlug of groupFile.order) {
        const lesson = lessonBySlug.get(`${key}/${lessonSlug}`)
        if (lesson === undefined) continue
        groupLessonIds.push(lesson.id)
        addLesson(lesson, groupKey, groupLessonIds.length)
      }
      if (groupLessonIds.length === 0) continue
      groupByKey.set(groupKey, {
        key: groupKey,
        topicKey: key,
        slug: name,
        title: groupFile.title,
        description: groupFile.description,
        lessonIds: groupLessonIds,
        readingMinutes: sumMinutes(groupLessonIds, lessonById),
      })
      entries.push({ kind: "group", groupKey })
    }

    const passingTracks = trackIdsOfTopic.get(key) ?? []
    const trackIds = [track, ...passingTracks.filter((id) => id !== track)]
    topicByKey.set(key, {
      key,
      track,
      slug,
      title: topic.title,
      titleEn: topic.titleEn,
      description: topic.description,
      isStart: topic.start === true,
      url: topicUrl(track, slug),
      prerequisites: topic.prerequisites.map(
        (entry) => resolveTopicRef(entry, track).key
      ),
      trackIds,
      isInterchange: trackIds.length > 1,
      entries,
      lessonIds: topicLessonIds,
      readingMinutes: sumMinutes(topicLessonIds, lessonById),
      hasPage: topicLessonIds.length > 0,
    })
  }

  const glossary = files.glossary
    .filter(isVisible)
    .map((term) => ({
      ...term,
      lessonIds: [...lessonById.values()]
        .filter((lesson) => lesson.glossary.includes(term.id))
        .map((lesson) => lesson.id),
    }))
    .sort((a, b) => a.term.localeCompare(b.term, "en"))

  const stats: ContentStats = {
    tracks: tracks.length,
    topics: topicByKey.size,
    lessons: lessonById.size,
    quizQuestions: [...lessonById.values()].reduce(
      (total, lesson) => total + (lesson.quiz?.length ?? 0),
      0
    ),
  }

  return {
    tracks,
    topicByKey,
    groupByKey,
    lessonById,
    glossary,
    map,
    startRoutes,
    stats,
  }
}

/**
 * Validates the files and builds the graph; throws on any error, returns the
 * warnings. `today` is the build date (YYYY-MM-DD).
 */
export function loadContent(
  files: ContentFiles,
  options: ContentOptions,
  today: string
): { readonly graph: ContentGraph; readonly warnings: readonly string[] } {
  const { errors, warnings } = validateContent(files, today)
  if (errors.length > 0) throw new ContentValidationError(errors)
  return { graph: buildContentGraph(files, options), warnings }
}

/** A lesson's neighbour in reading order, and whether it starts a new group or topic. */
export type Neighbour = {
  readonly lessonId: string
  readonly isOtherGroup: boolean
  readonly isOtherTopic: boolean
}

/**
 * Previous and next lesson along the lesson's home track, crossing groups and
 * topics; topics without lessons are skipped.
 */
export function neighboursOf(
  graph: ContentGraph,
  lessonId: string
): {
  readonly previous: Neighbour | undefined
  readonly next: Neighbour | undefined
} {
  const lesson = graph.lessonById.get(lessonId)
  const track = graph.tracks.find((item) => item.id === lesson?.track)
  if (lesson === undefined || track === undefined) {
    throw new Error(`Unknown lesson "${lessonId}"`)
  }
  const sequence = track.topicKeys.flatMap(
    (key) => graph.topicByKey.get(key)?.lessonIds ?? []
  )
  const index = sequence.indexOf(lessonId)
  const neighbourAt = (position: number): Neighbour | undefined => {
    const id = sequence[position]
    const other = id === undefined ? undefined : graph.lessonById.get(id)
    if (id === undefined || other === undefined) return undefined
    const isOtherTopic = other.topicKey !== lesson.topicKey
    return {
      lessonId: id,
      isOtherTopic,
      isOtherGroup: isOtherTopic || other.groupKey !== lesson.groupKey,
    }
  }
  return {
    previous: index > 0 ? neighbourAt(index - 1) : undefined,
    next: neighbourAt(index + 1),
  }
}

/** Days a lesson counts as new or updated (ADR-0009). */
export const FRESH_DAYS = 30

/**
 * "new" if published in the last `FRESH_DAYS` days, else "updated" if updated
 * in them. `today` is YYYY-MM-DD: the build date from `siteToday()`.
 */
export function freshnessOf(
  lesson: Pick<GraphLesson, "published" | "updated">,
  today: string
): "new" | "updated" | undefined {
  const daysSince = (date: string): number =>
    (Date.parse(today) - Date.parse(date)) / 86_400_000
  if (
    lesson.published !== undefined &&
    daysSince(lesson.published) <= FRESH_DAYS
  )
    return "new"
  if (daysSince(lesson.updated) <= FRESH_DAYS) return "updated"
  return undefined
}

/** The most recently published or updated lessons, newest first. */
export function recentLessons(
  graph: ContentGraph,
  limit: number
): GraphLesson[] {
  const lastChange = (lesson: GraphLesson): string =>
    lesson.published !== undefined && lesson.published > lesson.updated
      ? lesson.published
      : lesson.updated
  return [...graph.lessonById.values()]
    .sort(
      (a, b) =>
        lastChange(b).localeCompare(lastChange(a)) || a.id.localeCompare(b.id)
    )
    .slice(0, limit)
}
