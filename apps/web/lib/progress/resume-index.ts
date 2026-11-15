import type { ContentGraph } from "@workspace/content/graph"

import type { ResumeIndex } from "./resume"

/**
 * The resume index from the content graph: every lesson in the build with
 * its title, URL and scope (its group, or its topic when it has none), and
 * each scope's title and lessons. Built from the same graph as the pages,
 * so drafts follow the same rule (ADR-0009).
 */
export function resumeIndexOf(graph: ContentGraph): ResumeIndex {
  const lessons: Record<string, ResumeIndex["lessons"][string]> = {}
  const scopes: Record<string, ResumeIndex["scopes"][string]> = {}
  for (const lesson of graph.lessonById.values()) {
    const group =
      lesson.groupKey === undefined
        ? undefined
        : graph.groupByKey.get(lesson.groupKey)
    const topic = graph.topicByKey.get(lesson.topicKey)
    const scope = group?.key ?? lesson.topicKey
    lessons[lesson.id] = { title: lesson.title, url: lesson.url, scope }
    if (group !== undefined) {
      scopes[scope] = {
        title: group.title,
        isGroup: true,
        lessonIds: group.lessonIds,
      }
    } else if (topic !== undefined) {
      scopes[scope] = {
        title: topic.title,
        isGroup: false,
        lessonIds: topic.lessonIds,
      }
    }
  }
  return { lessons, scopes }
}
