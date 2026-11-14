import { describe, expect, it } from "vitest"

import { buildContentGraph } from "./graph"
import { contentSitemapEntries } from "./sitemap"
import { fixtureFiles } from "./test-fixtures"

describe("contentSitemapEntries", () => {
  it("lists topics with a published lesson, then published lessons", () => {
    const graph = buildContentGraph(fixtureFiles(), { includeDrafts: false })
    const paths = contentSitemapEntries(graph).map((entry) => entry.path)
    expect(paths).toContain("/learn/frontend/react")
    expect(paths).toContain("/learn/frontend/react/use-effect")
    expect(paths).toHaveLength(3 + 6)
  })

  it("dates a topic by its newest lesson", () => {
    const graph = buildContentGraph(fixtureFiles(), { includeDrafts: false })
    const react = contentSitemapEntries(graph).find(
      (entry) => entry.path === "/learn/frontend/react"
    )
    expect(react?.lastModified).toBe("2026-11-12")
  })

  it("never lists a draft, even when the graph includes drafts", () => {
    const files = fixtureFiles()
    files.lessons = files.lessons.map((item) =>
      item.location.topic === "a11y" ? { ...item, draft: true } : item
    )
    const graph = buildContentGraph(files, { includeDrafts: true })
    const paths = contentSitemapEntries(graph).map((entry) => entry.path)
    expect(paths.some((path) => path.includes("/a11y"))).toBe(false)
  })
})
