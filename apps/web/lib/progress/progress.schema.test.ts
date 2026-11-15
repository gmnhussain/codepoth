import { describe, expect, it } from "vitest"

import {
  EMPTY_PROGRESS,
  parseStoredProgress,
  progressSchema,
} from "./progress.schema"

const T1 = "2026-11-10T08:00:00.000Z"
const T2 = "2026-11-11T09:30:00.000Z"

const valid = {
  lessons: {
    "frontend.html.intro": { openedAt: T1, doneAt: T2 },
    "frontend.html.forms": {
      openedAt: T1,
      quiz: { score: 3, total: 5, at: T2 },
    },
  },
  bookmarks: { "frontend.html.intro": { at: T1 } },
  lastRead: { id: "frontend.html.forms", at: T2, anchor: "labels" },
  activity: { "2026-11-10": ["frontend.html.intro", "frontend.html.forms"] },
}

describe("parseStoredProgress", () => {
  it("returns a valid value unchanged", () => {
    expect(parseStoredProgress(valid)).toEqual(valid)
  })

  it.each([null, undefined, "text", 42, [], true])(
    "gives empty progress for a value that is not an object (%s)",
    (value) => {
      expect(parseStoredProgress(value)).toBe(EMPTY_PROGRESS)
    }
  )

  it("gives empty sections when a section is not an object", () => {
    expect(
      parseStoredProgress({ lessons: [], bookmarks: "x", activity: null })
    ).toEqual({ lessons: {}, bookmarks: {}, activity: {} })
  })

  it("drops invalid lesson entries one by one and keeps the valid ones", () => {
    const parsed = parseStoredProgress({
      ...valid,
      lessons: {
        ...valid.lessons,
        "frontend.html.broken": { openedAt: "yesterday" },
        "frontend.html.overscored": {
          openedAt: T1,
          quiz: { score: 6, total: 5, at: T2 },
        },
        "frontend.html.empty-quiz": {
          openedAt: T1,
          quiz: { score: 0, total: 0, at: T2 },
        },
        "Not An Id": { openedAt: T1 },
      },
    })
    expect(Object.keys(parsed.lessons)).toEqual([
      "frontend.html.intro",
      "frontend.html.forms",
    ])
  })

  it("keeps entries for lesson ids that are not in the content", () => {
    const parsed = parseStoredProgress({
      lessons: { "removed.topic.lesson": { openedAt: T1 } },
    })
    expect(parsed.lessons).toEqual({
      "removed.topic.lesson": { openedAt: T1 },
    })
  })

  it("drops invalid bookmarks and keeps the valid ones", () => {
    const parsed = parseStoredProgress({
      bookmarks: {
        "frontend.html.intro": { at: T1 },
        "frontend.html.forms": { at: 5 },
        single: { at: T1 },
      },
    })
    expect(parsed.bookmarks).toEqual({ "frontend.html.intro": { at: T1 } })
  })

  it("leaves out an invalid lastRead", () => {
    const parsed = parseStoredProgress({
      ...valid,
      lastRead: { id: "frontend.html.intro", at: T1, anchor: "" },
    })
    expect(parsed).not.toHaveProperty("lastRead")
  })

  it("cleans activity: bad days and ids dropped, duplicates removed, empty days left out", () => {
    const parsed = parseStoredProgress({
      activity: {
        "2026-11-10": [
          "frontend.html.intro",
          "frontend.html.intro",
          7,
          "bad id",
        ],
        "2026-02-30": ["frontend.html.intro"],
        "10/11/2026": ["frontend.html.intro"],
        "2026-11-11": ["bad id"],
        "2026-11-12": "frontend.html.intro",
      },
    })
    expect(parsed.activity).toEqual({ "2026-11-10": ["frontend.html.intro"] })
  })

  it("drops unknown top-level and entry keys", () => {
    const parsed = parseStoredProgress({
      ...valid,
      extra: true,
      lessons: { "frontend.html.intro": { openedAt: T1, done: true } },
    })
    expect(parsed).not.toHaveProperty("extra")
    expect(parsed.lessons).toEqual({
      "frontend.html.intro": { openedAt: T1 },
    })
  })
})

describe("progressSchema", () => {
  it("accepts a valid value", () => {
    expect(progressSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects the whole value when one entry is invalid", () => {
    const result = progressSchema.safeParse({
      ...valid,
      bookmarks: { ...valid.bookmarks, "frontend.html.forms": { at: "now" } },
    })
    expect(result.success).toBe(false)
  })

  it("removes duplicate ids within a day", () => {
    const result = progressSchema.parse({
      ...valid,
      activity: {
        "2026-11-10": ["frontend.html.intro", "frontend.html.intro"],
      },
    })
    expect(result.activity).toEqual({ "2026-11-10": ["frontend.html.intro"] })
  })
})
