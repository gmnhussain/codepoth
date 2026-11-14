import { slugSchema } from "./schemas/common.schema"

/**
 * Path rules for content files (ADR-0006, docs/content-model.md#urls-and-keys).
 * Paths are relative to `content/`; backslashes from Windows are accepted.
 */

/** Folder under `content/` that holds the tracks. */
export const TRACKS_DIR = "tracks"

/** Prefix of every topic and lesson URL. */
export const LEARN_PREFIX = "/learn"

const LESSON_EXTENSION = ".mdx"
const META_FILE = "_meta.json"

/** Where a lesson file sits. `group` is absent for a lesson directly in its topic. */
export interface LessonLocation {
  readonly track: string
  readonly topic: string
  readonly group?: string
  readonly slug: string
}

/** Which `_meta.json` a path is, and where it sits. */
export type MetaLocation =
  | { readonly level: "track"; readonly track: string }
  | { readonly level: "topic"; readonly track: string; readonly topic: string }
  | {
      readonly level: "group"
      readonly track: string
      readonly topic: string
      readonly group: string
    }

/** A topic named in an `order` array or a route: its track, folder and key. */
export interface ResolvedTopicRef {
  readonly track: string
  readonly topic: string
  readonly key: string
  /** True for `@track/topic`, i.e. a topic that lives in another track. */
  readonly isReference: boolean
}

function segmentsOf(path: string): string[] {
  return path.replaceAll("\\", "/").split("/")
}

/** Throws unless every name is a kebab-case slug (ADR-0006: names become URL segments). */
function assertSlugs(path: string, names: readonly string[]): void {
  for (const name of names) {
    if (!slugSchema.safeParse(name).success) {
      throw new Error(
        `"${name}" in "${path}" is not a lower-case kebab-case name`
      )
    }
  }
}

/** Throws unless `path` is `tracks/<track>/<topic>/[<group>/]<lesson>.mdx`. */
export function parseLessonPath(path: string): LessonLocation {
  const segments = segmentsOf(path)
  const file = segments.at(-1) ?? ""
  if (segments[0] !== TRACKS_DIR || !file.endsWith(LESSON_EXTENSION)) {
    throw new Error(`Not a lesson path: "${path}"`)
  }
  const slug = file.slice(0, -LESSON_EXTENSION.length)
  const [, track, topic, group] = segments
  if (track === undefined || topic === undefined) {
    throw new Error(`Not a lesson path: "${path}"`)
  }
  if (segments.length === 4) {
    assertSlugs(path, [track, topic, slug])
    return { track, topic, slug }
  }
  if (segments.length === 5 && group !== undefined) {
    assertSlugs(path, [track, topic, group, slug])
    return { track, topic, group, slug }
  }
  throw new Error(
    `A lesson sits in a topic or a group, never deeper: "${path}"`
  )
}

/** Throws unless `path` is a track, topic or group `_meta.json`. */
export function parseMetaPath(path: string): MetaLocation {
  const segments = segmentsOf(path)
  const [root, track, topic, group] = segments
  if (
    root !== TRACKS_DIR ||
    segments.at(-1) !== META_FILE ||
    track === undefined
  ) {
    throw new Error(`Not a _meta.json path: "${path}"`)
  }
  switch (segments.length) {
    case 3:
      assertSlugs(path, [track])
      return { level: "track", track }
    case 4:
      if (topic !== undefined) {
        assertSlugs(path, [track, topic])
        return { level: "topic", track, topic }
      }
      break
    case 5:
      if (topic !== undefined && group !== undefined) {
        assertSlugs(path, [track, topic, group])
        return { level: "group", track, topic, group }
      }
      break
    default:
      break
  }
  throw new Error(`_meta.json is too deep: "${path}"`)
}

/** Path key of a topic: `track/topic`. */
export function topicKeyOf(track: string, topic: string): string {
  return `${track}/${topic}`
}

/**
 * Resolves an entry of a track's `order` (or a route step): `"react"` is a
 * topic of `homeTrack`, `"@lang/javascript"` lives in another track.
 */
export function resolveTopicRef(
  entry: string,
  homeTrack: string
): ResolvedTopicRef {
  if (!entry.startsWith("@")) {
    return {
      track: homeTrack,
      topic: entry,
      key: topicKeyOf(homeTrack, entry),
      isReference: false,
    }
  }
  const [track, topic, ...rest] = entry.slice(1).split("/")
  if (
    track === undefined ||
    topic === undefined ||
    rest.length > 0 ||
    track === "" ||
    topic === ""
  ) {
    throw new Error(`A topic reference is @track/topic: "${entry}"`)
  }
  return { track, topic, key: topicKeyOf(track, topic), isReference: true }
}

/** URL of a topic page. */
export function topicUrl(track: string, topic: string): string {
  return `${LEARN_PREFIX}/${track}/${topic}`
}

/** URL of a lesson page; the group is never part of it (ADR-0006). */
export function lessonUrl(location: LessonLocation): string {
  return `${topicUrl(location.track, location.topic)}/${location.slug}`
}
