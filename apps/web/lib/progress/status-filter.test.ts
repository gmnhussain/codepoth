import { describe, expect, it } from "vitest"

import { EMPTY_PROGRESS } from "./empty-progress"
import type { Progress } from "./progress.schema"
import { passesStatus, statusCounts, statusFilterOf } from "./status-filter"

const DONE = "frontend.html.intro"
const READING = "frontend.html.forms"
const UNTOUCHED = "frontend.html.tables"
const T = "2026-11-10T08:00:00.000Z"

const progress: Progress = {
  ...EMPTY_PROGRESS,
  lessons: { [DONE]: { openedAt: T, doneAt: T }, [READING]: { openedAt: T } },
}

describe("statusFilterOf", () => {
  it("reads the two filters and treats anything else as all", () => {
    expect(statusFilterOf("todo")).toBe("todo")
    expect(statusFilterOf("done")).toBe("done")
    expect(statusFilterOf("")).toBe("all")
    expect(statusFilterOf("DONE")).toBe("all")
    expect(statusFilterOf("all")).toBe("all")
  })
})

describe("passesStatus", () => {
  it("lets everything through 'all'", () => {
    for (const id of [DONE, READING, UNTOUCHED]) {
      expect(passesStatus(progress, id, "all")).toBe(true)
    }
  })

  it("counts in-progress and untouched lessons as 'todo'", () => {
    expect(passesStatus(progress, DONE, "todo")).toBe(false)
    expect(passesStatus(progress, READING, "todo")).toBe(true)
    expect(passesStatus(progress, UNTOUCHED, "todo")).toBe(true)
  })

  it("keeps only finished lessons for 'done'", () => {
    expect(passesStatus(progress, DONE, "done")).toBe(true)
    expect(passesStatus(progress, READING, "done")).toBe(false)
    expect(passesStatus(progress, UNTOUCHED, "done")).toBe(false)
  })
})

describe("statusCounts", () => {
  it("counts each filter over the listed lessons", () => {
    expect(statusCounts(progress, [DONE, READING, UNTOUCHED])).toEqual({
      all: 3,
      todo: 2,
      done: 1,
    })
  })

  it("is all zeros for no lessons", () => {
    expect(statusCounts(progress, [])).toEqual({ all: 0, todo: 0, done: 0 })
  })
})
