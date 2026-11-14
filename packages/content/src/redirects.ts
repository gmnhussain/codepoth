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
 * current URL (ADR-0004, ADR-0006). Drafts count only when this build
 * includes them, so a redirect never points to a missing page. Throws when
 * an old path is a live lesson URL or is claimed by two lessons, which would
 * shadow a page or send readers to the wrong lesson.
 */
export function lessonRedirects(
  lessons: readonly Pick<
    LessonFile,
    "id" | "draft" | "previousSlugs" | "location"
  >[],
  options: ContentOptions
): LessonRedirect[] {
  const shown = lessons.filter(
    (lesson) => options.includeDrafts || !lesson.draft
  )
  const liveUrls = new Set(shown.map((lesson) => lessonUrl(lesson.location)))
  const claimedBy = new Map<string, string>()
  const redirects: LessonRedirect[] = []
  for (const lesson of shown) {
    const destination = lessonUrl(lesson.location)
    for (const source of lesson.previousSlugs) {
      if (liveUrls.has(source)) {
        throw new Error(
          `${lesson.id}: previousSlugs entry ${source} is the URL of a live lesson`
        )
      }
      const other = claimedBy.get(source)
      if (other !== undefined) {
        throw new Error(
          `${lesson.id}: previousSlugs entry ${source} is also claimed by ${other}`
        )
      }
      claimedBy.set(source, lesson.id)
      redirects.push({ source, destination, permanent: true })
    }
  }
  return redirects
}
