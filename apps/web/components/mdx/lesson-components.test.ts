import { describe, expect, it } from "vitest"

import { INNER_COMPONENTS, LESSON_BLOCKS } from "@workspace/content/blocks"

import { lessonComponentsFor } from "@/components/mdx/lesson-components"

describe("lessonComponentsFor", () => {
  it("renders every block and component that content validation allows", () => {
    const components = lessonComponentsFor({ id: "frontend.react.a" })
    const allowed = [
      ...LESSON_BLOCKS.map((block) => block.component),
      ...INNER_COMPONENTS,
    ]
    const missing = allowed.filter((name) => !Object.hasOwn(components, name))
    expect(missing).toEqual([])
  })
})
