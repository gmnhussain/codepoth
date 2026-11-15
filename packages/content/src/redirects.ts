import type { ContentOptions } from "./env"
import type { LessonFile } from "./files"

/*
 * Self-contained on purpose: next.config.ts loads this file through Node's
 * own module loader, which cannot resolve extensionless relative imports, so
 * only type imports (erased) are allowed here. `lessonUrl` in paths.ts is the
 * source of truth for the URL; a test checks this copy against it.
 */
function lessonUrl(location: LessonFile["location"]): string {
  return `/learn/${location.track}/${location.topic}/${location.slug}`
}

/** One permanent redirect, in the shape `redirects()` in next.config returns. */
export type LessonRedirect = {
  readonly source: string
  readonly destination: string
  readonly permanent: true
}

/**
 * Every `previousSlugs` entry as a permanent redirect to the lesson's
 * current URL (ADR-0004, ADR-0006). Throws when an old path is the URL of
 * any lesson, or is claimed by two lessons, which would shadow a page or
 * send readers to the wrong lesson. Both checks run against every lesson,
 * drafts included, so the same content passes or fails in every build;
 * redirects are emitted only for lessons this build shows, so one never
 * points to a missing page.
 */
export function lessonRedirects(
  lessons: readonly Pick<
    LessonFile,
    "id" | "draft" | "previousSlugs" | "location"
  >[],
  options: ContentOptions
): LessonRedirect[] {
  const lessonUrls = new Set(
    lessons.map((lesson) => lessonUrl(lesson.location))
  )
  const claimedBy = new Map<string, string>()
  for (const lesson of lessons) {
    for (const source of lesson.previousSlugs) {
      if (lessonUrls.has(source)) {
        throw new Error(
          `${lesson.id}: previousSlugs entry ${source} is the URL of a lesson`
        )
      }
      const other = claimedBy.get(source)
      if (other !== undefined) {
        throw new Error(
          `${lesson.id}: previousSlugs entry ${source} is also claimed by ${other}`
        )
      }
      claimedBy.set(source, lesson.id)
    }
  }
  return lessons
    .filter((lesson) => options.includeDrafts || !lesson.draft)
    .flatMap((lesson) =>
      lesson.previousSlugs.map((source) => ({
        source,
        destination: lessonUrl(lesson.location),
        permanent: true as const,
      }))
    )
}
