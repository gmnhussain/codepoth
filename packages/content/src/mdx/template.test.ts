import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { compileLesson } from "./compile"

// The lesson template authors copy (content/_templates/lesson.mdx) must pass
// the published-lesson rules, so it never teaches a shape the build rejects.
const template = readFileSync(
  new URL("../../../../content/_templates/lesson.mdx", import.meta.url),
  "utf8"
)

/** The MDX body after the frontmatter. */
function bodyOf(source: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(source)
  if (match === null) throw new Error("the template has no frontmatter")
  return source.slice(match[0].length)
}

describe("content/_templates/lesson.mdx", () => {
  it("compiles as a published lesson with every block in order", async () => {
    const { blocks } = await compileLesson(bodyOf(template), {
      isPublished: true,
    })
    expect(blocks).toEqual([
      "concept",
      "example",
      "mistakes",
      "summary",
      "quiz",
      "exercises",
      "practice",
    ])
  })
})
