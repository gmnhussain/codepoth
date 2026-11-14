import type { ContentFiles, LessonFile } from "./files"
import { resolveTopicRef, topicKeyOf } from "./paths"

/**
 * Cross-file rules (docs/content-model.md#validation). Each file has already
 * passed its own schema; these rules need several files at once.
 */

/** Problems found in the content. Errors fail the build; warnings are reported. */
export type ContentIssues = {
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
}

const TERM_USE = /<Term\s[^>]*?\bid\s*=\s*["']([^"']+)["']/g

/** Glossary ids used with `<Term id="…">` in an MDX body. */
export function termIdsIn(body: string): string[] {
  return [...body.matchAll(TERM_USE)].map((match) => match[1] ?? "")
}

function groupKeyOf(track: string, topic: string, group: string): string {
  return `${track}/${topic}/${group}`
}

function lessonName(lesson: LessonFile): string {
  const { track, topic, group, slug } = lesson.location
  return group === undefined
    ? `tracks/${track}/${topic}/${slug}.mdx`
    : `tracks/${track}/${topic}/${group}/${slug}.mdx`
}

/** Every child listed exactly once, nothing else listed. */
function checkOrder(
  errors: string[],
  where: string,
  order: readonly string[],
  children: ReadonlySet<string>
): void {
  const seen = new Set<string>()
  for (const entry of order) {
    if (seen.has(entry))
      errors.push(`${where}: "${entry}" is listed twice in order`)
    seen.add(entry)
    if (!children.has(entry)) {
      errors.push(`${where}: order lists "${entry}", which does not exist here`)
    }
  }
  for (const child of children) {
    if (!seen.has(child))
      errors.push(`${where}: "${child}" is missing from order`)
  }
}

function addTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key)
  if (list === undefined) map.set(key, [value])
  else list.push(value)
}

/**
 * Checks every cross-file rule and returns the problems found. `today`
 * (YYYY-MM-DD, the build date) rejects dates in the future, so a typo such as
 * 2027 cannot keep a lesson "new" for a year.
 */
export function validateContent(
  files: ContentFiles,
  today: string
): ContentIssues {
  const errors: string[] = []
  const warnings: string[] = []

  const trackIds = new Set<string>()
  for (const track of files.tracks) {
    if (track.location.level !== "track") continue
    trackIds.add(track.location.track)
  }
  const topicKeys = new Set<string>()
  const topicsOfTrack = new Map<string, string[]>()
  for (const topic of files.topics) {
    if (topic.location.level !== "topic") continue
    const { track, topic: slug } = topic.location
    topicKeys.add(topicKeyOf(track, slug))
    addTo(topicsOfTrack, track, slug)
    if (!trackIds.has(track))
      errors.push(`tracks/${track}: the track has no _meta.json`)
  }
  const groupKeys = new Set<string>()
  const groupsOfTopic = new Map<string, string[]>()
  for (const group of files.groups) {
    if (group.location.level !== "group") continue
    const { track, topic, group: slug } = group.location
    groupKeys.add(groupKeyOf(track, topic, slug))
    addTo(groupsOfTopic, topicKeyOf(track, topic), slug)
    if (!topicKeys.has(topicKeyOf(track, topic))) {
      errors.push(`tracks/${track}/${topic}: the topic has no _meta.json`)
    }
  }

  // Lessons: ids, file names, folders.
  const lessonById = new Map<string, LessonFile>()
  const lessonsOfTopic = new Map<string, string[]>()
  const lessonsOfGroup = new Map<string, string[]>()
  const slugsOfTopic = new Map<string, Set<string>>()
  for (const lesson of files.lessons) {
    const { track, topic, group, slug } = lesson.location
    // YYYY-MM-DD strings compare in date order.
    for (const field of ["published", "updated"] as const) {
      const date = lesson[field]
      if (date !== undefined && date > today) {
        errors.push(
          `${lessonName(lesson)}: ${field} ${date} is after the build date ${today}`
        )
      }
    }
    const topicKey = topicKeyOf(track, topic)
    if (lessonById.has(lesson.id)) {
      errors.push(
        `${lessonName(lesson)}: lesson id "${lesson.id}" is already used`
      )
    }
    lessonById.set(lesson.id, lesson)
    const slugs = slugsOfTopic.get(topicKey) ?? new Set<string>()
    if (slugs.has(slug)) {
      errors.push(
        `${lessonName(lesson)}: another lesson in ${topicKey} has the file name "${slug}"`
      )
    }
    slugs.add(slug)
    slugsOfTopic.set(topicKey, slugs)
    if (!topicKeys.has(topicKey))
      errors.push(`${lessonName(lesson)}: the topic has no _meta.json`)
    if (group === undefined) {
      addTo(lessonsOfTopic, topicKey, slug)
    } else {
      addTo(lessonsOfGroup, groupKeyOf(track, topic, group), slug)
      if (!groupKeys.has(groupKeyOf(track, topic, group))) {
        errors.push(`${lessonName(lesson)}: the group has no _meta.json`)
      }
    }
  }

  // Track order.
  if (files.tracksOrder === undefined) {
    errors.push("tracks/_meta.json is missing")
  } else {
    checkOrder(errors, "tracks/_meta.json", files.tracksOrder.order, trackIds)
  }

  // Each track's topics.
  for (const track of files.tracks) {
    if (track.location.level !== "track") continue
    const id = track.location.track
    const where = `tracks/${id}/_meta.json`
    const own: string[] = []
    const seenRefs = new Set<string>()
    for (const entry of track.order) {
      if (!entry.startsWith("@")) {
        own.push(entry)
        continue
      }
      const ref = resolveTopicRef(entry, id)
      if (ref.track === id) {
        errors.push(
          `${where}: "${entry}" is in this track; list it as "${ref.topic}"`
        )
      } else if (!topicKeys.has(ref.key)) {
        errors.push(`${where}: "${entry}" does not exist`)
      }
      if (seenRefs.has(ref.key))
        errors.push(`${where}: "${entry}" is listed twice in order`)
      seenRefs.add(ref.key)
    }
    checkOrder(errors, where, own, new Set(topicsOfTrack.get(id)))
  }

  // Each topic's groups and lessons, and its prerequisites.
  for (const topic of files.topics) {
    if (topic.location.level !== "topic") continue
    const { track, topic: slug } = topic.location
    const key = topicKeyOf(track, slug)
    const where = `tracks/${key}/_meta.json`
    const groups = groupsOfTopic.get(key) ?? []
    const lessons = lessonsOfTopic.get(key) ?? []
    for (const name of groups) {
      if (lessons.includes(name)) {
        errors.push(
          `${where}: "${name}" is both a group folder and a lesson file`
        )
      }
    }
    checkOrder(errors, where, topic.order, new Set([...groups, ...lessons]))
    for (const entry of topic.prerequisites) {
      if (!topicKeys.has(resolveTopicRef(entry, track).key)) {
        errors.push(`${where}: prerequisite "${entry}" does not exist`)
      }
    }
  }

  // Each group's lessons.
  for (const group of files.groups) {
    if (group.location.level !== "group") continue
    const { track, topic, group: slug } = group.location
    const key = groupKeyOf(track, topic, slug)
    checkOrder(
      errors,
      `tracks/${key}/_meta.json`,
      group.order,
      new Set(lessonsOfGroup.get(key))
    )
  }

  // References from lessons: prerequisites and glossary terms.
  const termById = new Map(files.glossary.map((term) => [term.id, term]))
  for (const lesson of files.lessons) {
    const where = lessonName(lesson)
    for (const id of lesson.prerequisites) {
      const prerequisite = lessonById.get(id)
      if (prerequisite === undefined) {
        errors.push(`${where}: prerequisite "${id}" does not exist`)
      } else if (!lesson.draft && prerequisite.draft) {
        errors.push(
          `${where}: a published lesson cannot need the draft "${id}"`
        )
      }
    }
    const bodyTerms = new Set(termIdsIn(lesson.content))
    // The glossary's "যে পাঠে আছে" list is built from the frontmatter, so a
    // term used in the body but missing there would drop the lesson from it.
    for (const id of bodyTerms) {
      if (!lesson.glossary.includes(id)) {
        errors.push(
          `${where}: <Term id="${id}"> is used but "${id}" is not in its glossary frontmatter`
        )
      }
    }
    const usedTerms = new Set([...lesson.glossary, ...bodyTerms])
    for (const id of usedTerms) {
      const term = termById.get(id)
      if (term === undefined) {
        errors.push(`${where}: glossary term "${id}" does not exist`)
      } else if (!lesson.draft && term.draft) {
        errors.push(
          `${where}: a published lesson cannot use the draft term "${id}"`
        )
      }
    }
  }

  for (const term of files.glossary) {
    if (!trackIds.has(term.track)) {
      errors.push(
        `glossary/${term.id}.mdx: track "${term.track}" does not exist`
      )
    }
  }

  // Map.
  if (files.map === undefined) {
    errors.push("map.json is missing")
  } else {
    for (const track of Object.keys(files.map.lines)) {
      if (!trackIds.has(track))
        errors.push(`map.json: line for unknown track "${track}"`)
    }
    for (const key of Object.keys(files.map.topics)) {
      if (!topicKeys.has(key)) errors.push(`map.json: unknown topic "${key}"`)
    }
    for (const key of topicKeys) {
      if (!Object.hasOwn(files.map.topics, key)) {
        warnings.push(
          `map.json: topic "${key}" has no coordinates and is left off the map`
        )
      }
    }
    for (const track of trackIds) {
      if (!Object.hasOwn(files.map.lines, track)) {
        warnings.push(
          `map.json: track "${track}" has no line and is left off the map`
        )
      }
    }
  }

  // Start routes.
  if (files.startRoutes === undefined) {
    errors.push("start-routes.json is missing")
  } else {
    for (const route of files.startRoutes.routes) {
      for (const step of route.steps) {
        if (typeof step !== "string") continue
        // Steps are always @track/topic; the home track is not used.
        if (!topicKeys.has(resolveTopicRef(step, "").key)) {
          errors.push(`start-routes.json: "${step}" does not exist`)
        }
      }
    }
  }

  return { errors, warnings }
}
