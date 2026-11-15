import type { Progress } from "./progress.schema"
import { summarize } from "./selectors"

/**
 * What Home needs to resume any lesson: each lesson's title, URL and scope
 * (its group, or its topic when it has none), and each scope's title and
 * lessons. Served as the prerendered `/lessons.json` and fetched only by a
 * returning reader.
 */
export type ResumeIndex = {
  readonly lessons: Readonly<
    Record<
      string,
      { readonly title: string; readonly url: string; readonly scope: string }
    >
  >
  readonly scopes: Readonly<
    Record<
      string,
      {
        readonly title: string
        readonly isGroup: boolean
        readonly lessonIds: readonly string[]
      }
    >
  >
}

export type Resume = {
  readonly title: string
  /** The lesson's URL, at the saved section when there is one. */
  readonly href: string
  readonly scope: {
    readonly title: string
    readonly isGroup: boolean
    readonly done: number
    readonly total: number
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isEntryOf(
  value: unknown,
  check: (entry: Record<string, unknown>) => boolean
): boolean {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => isRecord(entry) && check(entry))
  )
}

/** The two records with the fields the resume reads. */
function isResumeIndex(value: unknown): value is ResumeIndex {
  if (!isRecord(value)) return false
  const { lessons, scopes } = value
  return (
    isEntryOf(
      lessons,
      (entry) =>
        typeof entry.title === "string" &&
        typeof entry.url === "string" &&
        entry.url.startsWith("/") &&
        typeof entry.scope === "string"
    ) &&
    isEntryOf(
      scopes,
      (entry) =>
        typeof entry.title === "string" &&
        typeof entry.isGroup === "boolean" &&
        Array.isArray(entry.lessonIds) &&
        entry.lessonIds.every((id) => typeof id === "string")
    )
  )
}

/**
 * A light shape check of a fetched `/lessons.json`. Anything that is not
 * the index gives `undefined`, and Home keeps its first-visit view.
 */
export function parseResumeIndex(value: unknown): ResumeIndex | undefined {
  return isResumeIndex(value) ? value : undefined
}

/**
 * Where the reader stopped: the last-read lesson with its section and its
 * group's (or topic's) progress. `undefined` when nothing was read yet, or
 * when that lesson is not in this build (removed, or a draft).
 */
export function resumeOf(
  progress: Progress,
  index: ResumeIndex
): Resume | undefined {
  const lastRead = progress.lastRead
  if (lastRead === undefined || !Object.hasOwn(index.lessons, lastRead.id)) {
    return undefined
  }
  const lesson = index.lessons[lastRead.id]
  const scope =
    lesson === undefined || !Object.hasOwn(index.scopes, lesson.scope)
      ? undefined
      : index.scopes[lesson.scope]
  if (lesson === undefined || scope === undefined) return undefined
  const { done, total } = summarize(progress, scope.lessonIds)
  return {
    title: lesson.title,
    href:
      lastRead.anchor === undefined
        ? lesson.url
        : `${lesson.url}#${encodeURIComponent(lastRead.anchor)}`,
    scope: { title: scope.title, isGroup: scope.isGroup, done, total },
  }
}
