import type { ContentGraph } from "./graph"

/** A content page for the sitemap: its path and when it last changed. */
export type SitemapEntry = {
  readonly path: string
  /** ISO date; omitted when unknown. */
  readonly lastModified?: string
}

/**
 * Topic and lesson pages for the sitemap (conventions §12). Only published lessons are
 * listed, and only topics with one, even if this graph includes drafts; a
 * topic's date is its newest lesson's.
 */
export function contentSitemapEntries(graph: ContentGraph): SitemapEntry[] {
  const lessons = [...graph.lessonById.values()].filter(
    (lesson) => !lesson.draft
  )
  const newestByTopic = new Map<string, string>()
  for (const lesson of lessons) {
    const current = newestByTopic.get(lesson.topicKey)
    if (current === undefined || lesson.updated > current) {
      newestByTopic.set(lesson.topicKey, lesson.updated)
    }
  }
  const topics = [...graph.topicByKey.values()].flatMap((topic) => {
    const lastModified = newestByTopic.get(topic.key)
    return lastModified === undefined ? [] : [{ path: topic.url, lastModified }]
  })
  return [
    ...topics,
    ...lessons.map((lesson) => ({
      path: lesson.url,
      lastModified: lesson.updated,
    })),
  ]
}
