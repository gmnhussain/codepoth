import { describe, expect, it } from "vitest"

import { buildContentGraph } from "./graph"
import { findLesson, lessonRouteParams, topicPositionOn } from "./routes"
import { fixtureFiles, must } from "./test-fixtures"

const graph = buildContentGraph(fixtureFiles(), { includeDrafts: false })

describe("lessonRouteParams", () => {
  it("lists every lesson with its URL segments, without the group", () => {
    const params = lessonRouteParams(graph)
    expect(params).toHaveLength(graph.lessonById.size)
    expect(params).toContainEqual({
      track: "frontend",
      topic: "react",
      lesson: "use-effect",
    })
  })
})

describe("findLesson", () => {
  it("finds a lesson by track, topic and file name", () => {
    expect(
      findLesson(graph, {
        track: "frontend",
        topic: "react",
        lesson: "use-effect",
      })?.id
    ).toBe("frontend.react.hooks.use-effect")
  })

  it("returns undefined for a wrong track or an unknown lesson", () => {
    expect(
      findLesson(graph, { track: "lang", topic: "react", lesson: "use-effect" })
    ).toBeUndefined()
    expect(
      findLesson(graph, { track: "frontend", topic: "react", lesson: "nope" })
    ).toBeUndefined()
  })
})

describe("topicPositionOn", () => {
  it("counts own and referenced topics on the track", () => {
    const javascript = must(graph.topicByKey.get("lang/javascript"))
    expect(topicPositionOn(graph, "frontend", javascript)).toBe(2)
    expect(topicPositionOn(graph, "lang", javascript)).toBe(1)
  })

  it("is undefined for a track that does not pass the topic", () => {
    const react = must(graph.topicByKey.get("frontend/react"))
    expect(topicPositionOn(graph, "lang", react)).toBeUndefined()
  })
})
