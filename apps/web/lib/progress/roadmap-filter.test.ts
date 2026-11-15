import { describe, expect, it } from "vitest"

import { passesRoadmapFilter, roadmapFilterOf } from "./roadmap-filter"

const topic = { isStart: false, lessonCount: 4 }
const startTopic = { isStart: true, lessonCount: 2 }
const planned = { isStart: false, lessonCount: 0 }

describe("roadmapFilterOf", () => {
  it("reads every filter and treats anything else as all", () => {
    for (const value of ["start", "done", "reading", "todo"]) {
      expect(roadmapFilterOf(value)).toBe(value)
    }
    expect(roadmapFilterOf("")).toBe("all")
    expect(roadmapFilterOf("Start")).toBe("all")
    expect(roadmapFilterOf("in-progress")).toBe("all")
  })
})

describe("passesRoadmapFilter", () => {
  it("lets every topic through 'all'", () => {
    expect(passesRoadmapFilter("all", planned, "not-started")).toBe(true)
    expect(passesRoadmapFilter("all", topic, "done")).toBe(true)
  })

  it("keeps start topics for 'start', whatever their state", () => {
    expect(passesRoadmapFilter("start", startTopic, "done")).toBe(true)
    expect(passesRoadmapFilter("start", topic, "not-started")).toBe(false)
  })

  it("matches each state to its filter", () => {
    expect(passesRoadmapFilter("done", topic, "done")).toBe(true)
    expect(passesRoadmapFilter("done", topic, "in-progress")).toBe(false)
    expect(passesRoadmapFilter("reading", topic, "in-progress")).toBe(true)
    expect(passesRoadmapFilter("reading", topic, "not-started")).toBe(false)
    expect(passesRoadmapFilter("todo", topic, "not-started")).toBe(true)
    expect(passesRoadmapFilter("todo", topic, "done")).toBe(false)
  })

  it("leaves planned topics out of the state filters", () => {
    expect(passesRoadmapFilter("todo", planned, "not-started")).toBe(false)
    expect(passesRoadmapFilter("done", planned, "not-started")).toBe(false)
  })
})
