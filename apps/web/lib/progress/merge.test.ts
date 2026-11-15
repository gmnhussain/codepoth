import { describe, expect, it } from "vitest"

import { EMPTY_PROGRESS } from "./empty-progress"
import { mergeProgress } from "./merge"
import type { Progress } from "./progress.schema"

const INTRO = "frontend.html.intro"
const FORMS = "frontend.html.forms"
const TABLES = "frontend.html.tables"

const NOW = new Date(2026, 10, 15, 12, 0)

const EARLY = "2026-11-01T08:00:00.000Z"
const MIDDLE = "2026-11-05T08:00:00.000Z"
const LATE = "2026-11-10T08:00:00.000Z"

describe("mergeProgress", () => {
  it("keeps the earliest openedAt, the latest doneAt and the latest quiz per lesson", () => {
    const current: Progress = {
      ...EMPTY_PROGRESS,
      lessons: {
        [INTRO]: {
          openedAt: MIDDLE,
          doneAt: MIDDLE,
          quiz: { score: 5, total: 5, at: MIDDLE },
        },
      },
    }
    const incoming: Progress = {
      ...EMPTY_PROGRESS,
      lessons: {
        [INTRO]: {
          openedAt: EARLY,
          doneAt: LATE,
          quiz: { score: 1, total: 5, at: LATE },
        },
      },
    }
    expect(mergeProgress(current, incoming, NOW).lessons[INTRO]).toEqual({
      openedAt: EARLY,
      doneAt: LATE,
      quiz: { score: 1, total: 5, at: LATE },
    })
  })

  it("keeps a lesson done when only one side has it done", () => {
    const current: Progress = {
      ...EMPTY_PROGRESS,
      lessons: { [INTRO]: { openedAt: EARLY } },
    }
    const incoming: Progress = {
      ...EMPTY_PROGRESS,
      lessons: { [INTRO]: { openedAt: MIDDLE, doneAt: LATE } },
    }
    expect(mergeProgress(current, incoming, NOW).lessons[INTRO]).toEqual({
      openedAt: EARLY,
      doneAt: LATE,
    })
    expect(mergeProgress(incoming, current, NOW).lessons[INTRO]).toEqual({
      openedAt: EARLY,
      doneAt: LATE,
    })
  })

  it("keeps lessons that are on only one side", () => {
    const current: Progress = {
      ...EMPTY_PROGRESS,
      lessons: { [INTRO]: { openedAt: EARLY } },
    }
    const incoming: Progress = {
      ...EMPTY_PROGRESS,
      lessons: { [FORMS]: { openedAt: LATE } },
    }
    expect(mergeProgress(current, incoming, NOW).lessons).toEqual({
      [INTRO]: { openedAt: EARLY },
      [FORMS]: { openedAt: LATE },
    })
  })

  it("unions bookmarks, each with its earliest date", () => {
    const current: Progress = {
      ...EMPTY_PROGRESS,
      bookmarks: { [INTRO]: { at: LATE }, [FORMS]: { at: MIDDLE } },
    }
    const incoming: Progress = {
      ...EMPTY_PROGRESS,
      bookmarks: { [INTRO]: { at: EARLY }, [TABLES]: { at: LATE } },
    }
    expect(mergeProgress(current, incoming, NOW).bookmarks).toEqual({
      [INTRO]: { at: EARLY },
      [FORMS]: { at: MIDDLE },
      [TABLES]: { at: LATE },
    })
  })

  it("unions activity per day without duplicates", () => {
    const current: Progress = {
      ...EMPTY_PROGRESS,
      activity: { "2026-11-14": [INTRO, FORMS], "2026-11-13": [INTRO] },
    }
    const incoming: Progress = {
      ...EMPTY_PROGRESS,
      activity: { "2026-11-14": [FORMS, TABLES], "2026-11-12": [TABLES] },
    }
    expect(mergeProgress(current, incoming, NOW).activity).toEqual({
      "2026-11-14": [INTRO, FORMS, TABLES],
      "2026-11-13": [INTRO],
      "2026-11-12": [TABLES],
    })
  })

  it("prunes activity outside the 140-day window", () => {
    const incoming: Progress = {
      ...EMPTY_PROGRESS,
      activity: { "2026-06-28": [INTRO], "2026-06-29": [INTRO] },
    }
    expect(mergeProgress(EMPTY_PROGRESS, incoming, NOW).activity).toEqual({
      "2026-06-29": [INTRO],
    })
  })

  it("keeps the most recent lastRead from either side", () => {
    const older: Progress = {
      ...EMPTY_PROGRESS,
      lastRead: { id: INTRO, at: EARLY, anchor: "top" },
    }
    const newer: Progress = {
      ...EMPTY_PROGRESS,
      lastRead: { id: FORMS, at: LATE },
    }
    expect(mergeProgress(older, newer, NOW).lastRead).toEqual(newer.lastRead)
    expect(mergeProgress(newer, older, NOW).lastRead).toEqual(newer.lastRead)
    expect(mergeProgress(EMPTY_PROGRESS, older, NOW).lastRead).toEqual(
      older.lastRead
    )
    expect(
      mergeProgress(EMPTY_PROGRESS, EMPTY_PROGRESS, NOW)
    ).not.toHaveProperty("lastRead")
  })

  it("compares times, not strings, when fraction digits differ", () => {
    const current: Progress = {
      ...EMPTY_PROGRESS,
      lastRead: { id: INTRO, at: "2026-11-10T08:00:00.5Z" },
    }
    const incoming: Progress = {
      ...EMPTY_PROGRESS,
      lastRead: { id: FORMS, at: "2026-11-10T08:00:00.123Z" },
    }
    expect(mergeProgress(current, incoming, NOW).lastRead?.id).toBe(INTRO)
  })

  it("does not change either input", () => {
    const current: Progress = {
      ...EMPTY_PROGRESS,
      lessons: { [INTRO]: { openedAt: MIDDLE } },
      activity: { "2026-11-14": [INTRO] },
    }
    const incoming: Progress = {
      ...EMPTY_PROGRESS,
      lessons: { [INTRO]: { openedAt: EARLY, doneAt: LATE } },
      activity: { "2026-11-14": [FORMS] },
    }
    const before = structuredClone([current, incoming])
    mergeProgress(current, incoming, NOW)
    expect([current, incoming]).toEqual(before)
  })
})
