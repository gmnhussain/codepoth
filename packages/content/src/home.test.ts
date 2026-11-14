import { describe, expect, it } from "vitest"

import { buildContentGraph } from "./graph"
import { firstTopicWithPage, homeStartLesson, startStepsOf } from "./home"
import { fixtureFiles, must } from "./test-fixtures"

const graph = buildContentGraph(fixtureFiles(), { includeDrafts: false })
const route = must(graph.startRoutes.routes[0])

describe("startStepsOf", () => {
  it("resolves topic references and keeps labels", () => {
    expect(
      startStepsOf(graph, route).map((step) =>
        step.kind === "topic" ? step.topic.key : step.label
      )
    ).toEqual(["frontend/a11y", "যেকোনো"])
  })
})

describe("firstTopicWithPage", () => {
  it("gives the first referenced topic that has a page", () => {
    expect(firstTopicWithPage(graph, route)?.key).toBe("frontend/a11y")
  })

  it("is undefined when no step has a page", () => {
    const files = fixtureFiles()
    files.lessons = files.lessons.map((item) => ({ ...item, draft: true }))
    const allDrafts = buildContentGraph(files, { includeDrafts: false })
    expect(firstTopicWithPage(allDrafts, route)).toBeUndefined()
  })
})

describe("homeStartLesson", () => {
  it("is the first lesson of the first route topic with lessons", () => {
    expect(homeStartLesson(graph)?.id).toBe("frontend.a11y.why-a11y")
  })

  it("skips topics without published lessons", () => {
    const files = fixtureFiles()
    files.lessons = files.lessons.map((item) =>
      item.location.topic === "a11y" ? { ...item, draft: true } : item
    )
    files.startRoutes = {
      routes: [{ ...route, steps: ["@frontend/a11y", "@frontend/react"] }],
    }
    const withoutA11y = buildContentGraph(files, { includeDrafts: false })
    expect(homeStartLesson(withoutA11y)?.id).toBe("frontend.react.basics.jsx")
  })

  it("is undefined while nothing is published", () => {
    const files = fixtureFiles()
    files.lessons = files.lessons.map((item) => ({ ...item, draft: true }))
    expect(
      homeStartLesson(buildContentGraph(files, { includeDrafts: false }))
    ).toBeUndefined()
  })
})
