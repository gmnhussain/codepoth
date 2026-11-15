import { contentFiles } from "@workspace/content/content"
import type { ContentGraph } from "@workspace/content/graph"
import { buildContentGraph } from "@workspace/content/graph"

/**
 * The content graph with or without drafts, from the same files and builder
 * the site uses. Lets a test of the build without drafts know which pages
 * must not exist there.
 */
export function contentGraph(includeDrafts: boolean): ContentGraph {
  return buildContentGraph(contentFiles, { includeDrafts })
}

/** Lessons only the build with drafts has, in reading order. */
export function draftLessons() {
  const published = contentGraph(false).lessonById
  return [...contentGraph(true).lessonById.values()].filter(
    (lesson) => !published.has(lesson.id)
  )
}
