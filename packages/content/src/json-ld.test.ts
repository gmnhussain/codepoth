import { describe, expect, it } from "vitest"

import { buildContentGraph } from "./graph"
import { lessonJsonLd, serializeJsonLd, websiteJsonLd } from "./json-ld"
import { fixtureFiles, must } from "./test-fixtures"

// Built from code points so the source has no literal line terminators.
const LINE_SEPARATOR = String.fromCodePoint(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCodePoint(0x2029)

describe("serializeJsonLd", () => {
  const hostile = {
    name: '</script><script>alert("x")</script>',
    description: "<!-- comment --> a < b && c > d",
    separators: `line${LINE_SEPARATOR}para${PARAGRAPH_SEPARATOR}end`,
  }

  it("contains no character that can end the script element", () => {
    const json = serializeJsonLd(hostile)
    expect(json).not.toContain("<")
    expect(json).not.toContain(">")
    expect(json).not.toContain("&")
    expect(json.toLowerCase()).not.toContain("</script")
    expect(json).not.toContain(LINE_SEPARATOR)
    expect(json).not.toContain(PARAGRAPH_SEPARATOR)
  })

  it("parses back to the same data", () => {
    expect(JSON.parse(serializeJsonLd(hostile))).toEqual(hostile)
  })
})

describe("websiteJsonLd", () => {
  it("names the site with an absolute URL", () => {
    const data = websiteJsonLd("বর্ণনা")
    expect(data["@type"]).toBe("WebSite")
    expect(data.url).toMatch(/^https:\/\/.+\/$/)
  })
})

describe("lessonJsonLd", () => {
  const graph = buildContentGraph(fixtureFiles(), { includeDrafts: false })
  const lesson = must(graph.lessonById.get("frontend.react.hooks.use-effect"))
  const [resource, breadcrumbs] = lessonJsonLd(graph, lesson, "রোডম্যাপ")

  it("describes the lesson as a free learning resource", () => {
    expect(resource).toMatchObject({
      "@type": "LearningResource",
      name: lesson.title,
      inLanguage: "bn",
      isAccessibleForFree: true,
      dateModified: "2026-11-12",
    })
    expect(resource?.url).toMatch(/\/learn\/frontend\/react\/use-effect$/)
  })

  it("lists roadmap › track › topic › lesson with absolute URLs", () => {
    const items = (breadcrumbs?.itemListElement ?? []) as {
      name: string
      item: string
      position: number
    }[]
    expect(items.map((item) => item.name)).toEqual([
      "রোডম্যাপ",
      "Frontend",
      "React",
      lesson.title,
    ])
    expect(items.map((item) => item.position)).toEqual([1, 2, 3, 4])
    expect(items[1]?.item).toMatch(/\/roadmap\?track=frontend$/)
  })
})
