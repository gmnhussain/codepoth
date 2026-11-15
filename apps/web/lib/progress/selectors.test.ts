import { describe, expect, it } from "vitest"

import { EMPTY_PROGRESS } from "./progress.schema"
import type { Progress } from "./progress.schema"
import {
  activityByDay,
  averageQuizScore,
  bookmarksNewestFirst,
  lastSaved,
  lessonState,
  nextUnfinished,
  quizResultsWeakestFirst,
  summarize,
} from "./selectors"

const INTRO = "frontend.html.intro"
const FORMS = "frontend.html.forms"
const TABLES = "frontend.html.tables"
const REMOVED = "old.topic.lesson"
const LESSONS = [INTRO, FORMS, TABLES]

const T1 = "2026-11-01T08:00:00.000Z"
const T2 = "2026-11-05T08:00:00.000Z"
const T3 = "2026-11-10T08:00:00.000Z"

const progress: Progress = {
  lessons: {
    [INTRO]: { openedAt: T1, doneAt: T2, quiz: { score: 4, total: 5, at: T2 } },
    [FORMS]: { openedAt: T2, quiz: { score: 1, total: 4, at: T3 } },
    [REMOVED]: {
      openedAt: T1,
      doneAt: T1,
      quiz: { score: 0, total: 5, at: T1 },
    },
  },
  bookmarks: {
    [INTRO]: { at: T1 },
    [TABLES]: { at: T3 },
    [REMOVED]: { at: T3 },
  },
  activity: {},
}

describe("lessonState", () => {
  it("tells done, in progress and not started apart", () => {
    expect(lessonState(progress, INTRO)).toBe("done")
    expect(lessonState(progress, FORMS)).toBe("in-progress")
    expect(lessonState(progress, TABLES)).toBe("not-started")
  })

  it("treats inherited object keys as not started", () => {
    expect(lessonState(EMPTY_PROGRESS, "constructor")).toBe("not-started")
  })
})

describe("summarize", () => {
  it("counts done and started lessons of the listed ids only", () => {
    expect(summarize(progress, LESSONS)).toEqual({
      total: 3,
      done: 1,
      started: 2,
      state: "in-progress",
    })
  })

  it("is done only when every lesson is done", () => {
    expect(summarize(progress, [INTRO])).toEqual({
      total: 1,
      done: 1,
      started: 1,
      state: "done",
    })
  })

  it("is not started when nothing is opened, including an empty list", () => {
    expect(summarize(progress, [TABLES]).state).toBe("not-started")
    expect(summarize(progress, [])).toEqual({
      total: 0,
      done: 0,
      started: 0,
      state: "not-started",
    })
  })
})

describe("nextUnfinished", () => {
  it("is the first lesson in order that is not done", () => {
    expect(nextUnfinished(progress, LESSONS)).toBe(FORMS)
  })

  it("is undefined when every lesson is done or the list is empty", () => {
    expect(nextUnfinished(progress, [INTRO])).toBeUndefined()
    expect(nextUnfinished(progress, [])).toBeUndefined()
  })
})

describe("quiz results", () => {
  it("lists the listed lessons' attempts, weakest first", () => {
    expect(quizResultsWeakestFirst(progress, LESSONS)).toEqual([
      { id: FORMS, score: 1, total: 4, at: T3 },
      { id: INTRO, score: 4, total: 5, at: T2 },
    ])
  })

  it("puts the older attempt first on an equal share", () => {
    const tied: Progress = {
      ...EMPTY_PROGRESS,
      lessons: {
        [INTRO]: { openedAt: T1, quiz: { score: 1, total: 2, at: T3 } },
        [FORMS]: { openedAt: T1, quiz: { score: 2, total: 4, at: T1 } },
      },
    }
    expect(
      quizResultsWeakestFirst(tied, LESSONS).map((result) => result.id)
    ).toEqual([FORMS, INTRO])
  })

  it("averages each quiz's share equally", () => {
    const results = quizResultsWeakestFirst(progress, LESSONS)
    expect(averageQuizScore(results)).toBeCloseTo((0.25 + 0.8) / 2)
    expect(averageQuizScore([])).toBeUndefined()
  })
})

describe("bookmarksNewestFirst", () => {
  it("lists the listed lessons' bookmarks, newest first", () => {
    expect(bookmarksNewestFirst(progress, LESSONS)).toEqual([
      { id: TABLES, at: T3 },
      { id: INTRO, at: T1 },
    ])
  })
})

describe("activityByDay", () => {
  const withActivity: Progress = {
    ...EMPTY_PROGRESS,
    activity: {
      "2026-06-28": [INTRO],
      "2026-06-29": [INTRO, FORMS],
      "2026-11-15": [REMOVED],
      "2026-11-16": [INTRO],
    },
  }

  it("gives 140 days ending today, oldest first, with zeros for quiet days", () => {
    const days = activityByDay(withActivity, "2026-11-15")
    expect(days).toHaveLength(140)
    expect(days[0]).toEqual({ day: "2026-06-29", count: 2 })
    expect(days[1]).toEqual({ day: "2026-06-30", count: 0 })
    expect(days.at(-1)).toEqual({ day: "2026-11-15", count: 1 })
  })
})

describe("lastSaved", () => {
  it("is the latest timestamp anywhere in the data", () => {
    expect(lastSaved(progress)).toBe(T3)
    expect(
      lastSaved({
        ...progress,
        lastRead: { id: INTRO, at: "2026-11-12T00:00:00Z" },
      })
    ).toBe("2026-11-12T00:00:00Z")
  })

  it("is undefined for empty progress", () => {
    expect(lastSaved(EMPTY_PROGRESS)).toBeUndefined()
  })
})
