import { describe, expect, it } from "vitest"

import { buildContentGraph } from "./graph"
import { buildRoadmap, isTopicVisible, topicNeighbours } from "./roadmap"
import { fixtureFiles, must } from "./test-fixtures"

const roadmap = buildRoadmap(
  buildContentGraph(fixtureFiles(), { includeDrafts: false })
)
const topic = (key: string) =>
  must(roadmap.topics.find((item) => item.key === key))

describe("buildRoadmap", () => {
  it("takes the canvas size and track lines from map.json", () => {
    expect(roadmap.width).toBe(1400)
    expect(roadmap.tracks.map((track) => [track.id, track.points])).toEqual([
      ["frontend", "400,100 400,440"],
      ["lang", "160,240 960,240"],
    ])
  })

  it("lists each topic once, in track order", () => {
    expect(roadmap.topics.map((item) => item.key)).toEqual([
      "frontend/a11y",
      "lang/javascript",
      "frontend/react",
    ])
  })

  it("carries position, flags and the lesson tree", () => {
    const react = topic("frontend/react")
    expect([react.x, react.y, react.label]).toEqual([400, 360, "left"])
    expect(react.groups.map((group) => group.title)).toEqual(["শুরু", "Hooks"])
    expect(react.groups[1]?.lessons.map((lesson) => lesson.url)).toEqual([
      "/learn/frontend/react/use-state",
      "/learn/frontend/react/use-effect",
    ])
    expect(react.lessonCount).toBe(3)
    expect(topic("frontend/a11y").isStart).toBe(true)
    expect(topic("lang/javascript").isInterchange).toBe(true)
    expect(topic("lang/javascript").trackIds).toEqual(["lang", "frontend"])
  })
})

describe("isTopicVisible", () => {
  it("shows everything with no filter", () => {
    expect(roadmap.topics.every((item) => isTopicVisible(item, {}))).toBe(true)
  })

  it("keeps topics on a focused track, including referenced ones", () => {
    const onLang = roadmap.topics.filter((item) =>
      isTopicVisible(item, { track: "lang" })
    )
    expect(onLang.map((item) => item.key)).toEqual(["lang/javascript"])
    expect(
      isTopicVisible(topic("lang/javascript"), { track: "frontend" })
    ).toBe(true)
  })

  it("keeps start topics only", () => {
    const start = roadmap.topics.filter((item) =>
      isTopicVisible(item, { startOnly: true })
    )
    expect(start.map((item) => item.key)).toEqual(["frontend/a11y"])
  })

  it("matches the search against the topic name, combined with the rest", () => {
    expect(isTopicVisible(topic("frontend/react"), { query: "rea" })).toBe(true)
    expect(isTopicVisible(topic("frontend/react"), { query: "vue" })).toBe(
      false
    )
    expect(
      isTopicVisible(topic("frontend/react"), { query: "rea", track: "lang" })
    ).toBe(false)
  })
})

describe("topicNeighbours", () => {
  it("gives the topics before and after on a track", () => {
    expect(topicNeighbours(roadmap, "frontend", "lang/javascript")).toEqual({
      previous: "frontend/a11y",
      next: "frontend/react",
    })
    expect(topicNeighbours(roadmap, "frontend", "frontend/a11y")).toEqual({
      previous: undefined,
      next: "lang/javascript",
    })
    expect(topicNeighbours(roadmap, "lang", "frontend/react")).toEqual({
      previous: undefined,
      next: undefined,
    })
  })
})
