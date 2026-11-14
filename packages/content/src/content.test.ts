import { describe, expect, it } from "vitest"

import { contentFiles } from "./content"
import { buildContentGraph } from "./graph"
import { validateContent } from "./validate"

// Content validation over the real content/ folder (conventions §14). Runs on
// the output of `content:generate`, which turbo runs first. Warnings fail here
// too, so a topic missing from the map fails locally and in CI.
const today = new Date().toISOString().slice(0, 10)

describe("content/", () => {
  it("passes every cross-file rule with no warnings", () => {
    expect(validateContent(contentFiles, today)).toEqual({
      errors: [],
      warnings: [],
    })
  })

  it("builds with drafts included", () => {
    const graph = buildContentGraph(contentFiles, { includeDrafts: true })
    expect(graph.stats.lessons).toBe(contentFiles.lessons.length)
  })

  it("builds without drafts, even when every lesson is a draft", () => {
    const graph = buildContentGraph(contentFiles, { includeDrafts: false })
    const published = contentFiles.lessons.filter((lesson) => !lesson.draft)
    expect(graph.stats.lessons).toBe(published.length)
    expect(graph.tracks.length).toBe(contentFiles.tracksOrder?.order.length)
    for (const topic of graph.topicByKey.values()) {
      expect(topic.hasPage, topic.key).toBe(topic.lessonIds.length > 0)
    }
  })
})
