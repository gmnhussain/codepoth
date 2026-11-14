import { describe, expect, it } from "vitest"

import { buildContentGraph } from "./graph"
import {
  findLesson,
  findTopic,
  groupAnchorOf,
  lessonRouteParams,
  nextTopicOn,
  topicPositionOn,
  topicRouteParams,
} from "./routes"
import { fixtureFiles, must } from "./test-fixtures"

const graph = buildContentGraph(fixtureFiles(), { includeDrafts: false })

describe("topic routes", () => {
  it("lists only topics that have a page, under their home track", () => {
    expect(topicRouteParams(graph)).toEqual([
      { track: "frontend", topic: "a11y" },
      { track: "frontend", topic: "react" },
      { track: "lang", topic: "javascript" },
    ])
  })

  it("leaves out a topic whose lessons are all drafts", () => {
    const files = fixtureFiles()
    files.lessons = files.lessons.map((item) =>
      item.location.topic === "a11y" ? { ...item, draft: true } : item
    )
    const withoutA11y = buildContentGraph(files, { includeDrafts: false })
    expect(topicRouteParams(withoutA11y)).not.toContainEqual({
      track: "frontend",
      topic: "a11y",
    })
    expect(
      findTopic(withoutA11y, { track: "frontend", topic: "a11y" })
    ).toBeUndefined()
  })

  it("finds a topic only under its home track", () => {
    expect(findTopic(graph, { track: "lang", topic: "javascript" })?.key).toBe(
      "lang/javascript"
    )
    expect(
      findTopic(graph, { track: "frontend", topic: "javascript" })
    ).toBeUndefined()
  })

  it("gives the next topic on a track, including referenced ones", () => {
    expect(nextTopicOn(graph, "frontend", "frontend/a11y")?.key).toBe(
      "lang/javascript"
    )
    expect(nextTopicOn(graph, "frontend", "frontend/react")).toBeUndefined()
    expect(nextTopicOn(graph, "lang", "frontend/react")).toBeUndefined()
  })

  it("names a group's anchor", () => {
    expect(groupAnchorOf("hooks")).toBe("group-hooks")
  })
})

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
