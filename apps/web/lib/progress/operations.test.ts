import { describe, expect, it } from "vitest"

import { EMPTY_PROGRESS } from "./empty-progress"
import {
  markDone,
  recordAnchor,
  recordOpen,
  recordQuiz,
  setBookmark,
  unmarkDone,
} from "./operations"
import type { Progress } from "./progress.schema"

const INTRO = "frontend.html.intro"
const FORMS = "frontend.html.forms"

// Local times, so the activity day does not depend on the test machine's zone.
const MORNING = new Date(2026, 10, 15, 9, 0)
const EVENING = new Date(2026, 10, 15, 21, 0)
const NEXT_DAY = new Date(2026, 10, 16, 9, 0)

function frozenCopy(progress: Progress): Progress {
  const copy = structuredClone(progress)
  return Object.freeze(copy)
}

describe("recordOpen", () => {
  it("creates the entry, sets lastRead and counts today on the first visit", () => {
    const opened = recordOpen(EMPTY_PROGRESS, INTRO, MORNING)
    expect(opened).toEqual({
      lessons: { [INTRO]: { openedAt: MORNING.toISOString() } },
      bookmarks: {},
      lastRead: { id: INTRO, at: MORNING.toISOString() },
      activity: { "2026-11-15": [INTRO] },
    })
  })

  it("never overwrites openedAt and does not count a reload twice", () => {
    const first = recordOpen(EMPTY_PROGRESS, INTRO, MORNING)
    const reloaded = recordOpen(first, INTRO, EVENING)
    expect(reloaded.lessons[INTRO]?.openedAt).toBe(MORNING.toISOString())
    expect(reloaded.activity).toEqual({ "2026-11-15": [INTRO] })
    expect(reloaded.lastRead?.at).toBe(EVENING.toISOString())
  })

  it("counts each distinct lesson once per day", () => {
    let progress = recordOpen(EMPTY_PROGRESS, INTRO, MORNING)
    progress = recordOpen(progress, FORMS, MORNING)
    progress = recordOpen(progress, INTRO, EVENING)
    progress = recordOpen(progress, INTRO, NEXT_DAY)
    expect(progress.activity).toEqual({
      "2026-11-15": [INTRO, FORMS],
      "2026-11-16": [INTRO],
    })
  })

  it("keeps the section anchor when the last-read lesson is reopened", () => {
    const reading = recordAnchor(
      recordOpen(EMPTY_PROGRESS, INTRO, MORNING),
      INTRO,
      "attributes",
      MORNING
    )
    expect(recordOpen(reading, INTRO, EVENING).lastRead).toEqual({
      id: INTRO,
      at: EVENING.toISOString(),
      anchor: "attributes",
    })
    expect(recordOpen(reading, FORMS, EVENING).lastRead).toEqual({
      id: FORMS,
      at: EVENING.toISOString(),
    })
  })

  it("prunes activity older than 140 days on write", () => {
    const old: Progress = {
      ...EMPTY_PROGRESS,
      activity: { "2026-06-28": [FORMS], "2026-06-29": [FORMS] },
    }
    expect(recordOpen(old, INTRO, MORNING).activity).toEqual({
      "2026-06-29": [FORMS],
      "2026-11-15": [INTRO],
    })
  })

  it("does not change its input", () => {
    const input = frozenCopy(recordOpen(EMPTY_PROGRESS, INTRO, MORNING))
    const before = structuredClone(input)
    recordOpen(input, FORMS, EVENING)
    expect(input).toEqual(before)
  })
})

describe("recordAnchor", () => {
  const opened = recordOpen(EMPTY_PROGRESS, INTRO, MORNING)

  it("points lastRead at the section", () => {
    expect(recordAnchor(opened, INTRO, "forms", EVENING).lastRead).toEqual({
      id: INTRO,
      at: EVENING.toISOString(),
      anchor: "forms",
    })
  })

  it("returns the same object when lastRead already points there", () => {
    const reading = recordAnchor(opened, INTRO, "forms", MORNING)
    expect(recordAnchor(reading, INTRO, "forms", EVENING)).toBe(reading)
    expect(recordAnchor(opened, INTRO, undefined, EVENING)).toBe(opened)
  })

  it("removes the anchor at the top of the lesson", () => {
    const reading = recordAnchor(opened, INTRO, "forms", MORNING)
    expect(recordAnchor(reading, INTRO, undefined, EVENING).lastRead).toEqual({
      id: INTRO,
      at: EVENING.toISOString(),
    })
  })

  it("does not count activity", () => {
    expect(recordAnchor(opened, INTRO, "forms", NEXT_DAY).activity).toBe(
      opened.activity
    )
  })
})

describe("markDone and unmarkDone", () => {
  it("marks an opened lesson done and keeps openedAt", () => {
    const done = markDone(
      recordOpen(EMPTY_PROGRESS, INTRO, MORNING),
      INTRO,
      EVENING
    )
    expect(done.lessons[INTRO]).toEqual({
      openedAt: MORNING.toISOString(),
      doneAt: EVENING.toISOString(),
    })
  })

  it("opens a lesson that was never opened and counts today", () => {
    const done = markDone(EMPTY_PROGRESS, INTRO, MORNING)
    expect(done.lessons[INTRO]).toEqual({
      openedAt: MORNING.toISOString(),
      doneAt: MORNING.toISOString(),
    })
    expect(done.activity).toEqual({ "2026-11-15": [INTRO] })
  })

  it("returns the same object when the lesson is already done", () => {
    const done = markDone(EMPTY_PROGRESS, INTRO, MORNING)
    expect(markDone(done, INTRO, NEXT_DAY)).toBe(done)
  })

  it("un-marking keeps the entry and its quiz, so the lesson is in progress again", () => {
    const quizzed = recordQuiz(EMPTY_PROGRESS, INTRO, 4, 5, MORNING)
    const reopened = unmarkDone(markDone(quizzed, INTRO, EVENING), INTRO)
    expect(reopened.lessons[INTRO]).toEqual({
      openedAt: MORNING.toISOString(),
      quiz: { score: 4, total: 5, at: MORNING.toISOString() },
    })
  })

  it("un-marking a lesson that is not done returns the same object", () => {
    const opened = recordOpen(EMPTY_PROGRESS, INTRO, MORNING)
    expect(unmarkDone(opened, INTRO)).toBe(opened)
    expect(unmarkDone(EMPTY_PROGRESS, INTRO)).toBe(EMPTY_PROGRESS)
  })
})

describe("setBookmark", () => {
  it("adds a bookmark with its date", () => {
    expect(setBookmark(EMPTY_PROGRESS, INTRO, true, MORNING).bookmarks).toEqual(
      { [INTRO]: { at: MORNING.toISOString() } }
    )
  })

  it("removes only that bookmark", () => {
    let progress = setBookmark(EMPTY_PROGRESS, INTRO, true, MORNING)
    progress = setBookmark(progress, FORMS, true, MORNING)
    expect(setBookmark(progress, INTRO, false, EVENING).bookmarks).toEqual({
      [FORMS]: { at: MORNING.toISOString() },
    })
  })

  it("returns the same object when the bookmark is already in that state", () => {
    const bookmarked = setBookmark(EMPTY_PROGRESS, INTRO, true, MORNING)
    expect(setBookmark(bookmarked, INTRO, true, EVENING)).toBe(bookmarked)
    expect(setBookmark(EMPTY_PROGRESS, INTRO, false, EVENING)).toBe(
      EMPTY_PROGRESS
    )
  })

  it("does not count activity", () => {
    expect(setBookmark(EMPTY_PROGRESS, INTRO, true, MORNING).activity).toEqual(
      {}
    )
  })
})

describe("recordQuiz", () => {
  it("keeps only the latest attempt and leaves doneAt alone", () => {
    let progress = markDone(EMPTY_PROGRESS, INTRO, MORNING)
    progress = recordQuiz(progress, INTRO, 2, 5, MORNING)
    progress = recordQuiz(progress, INTRO, 5, 5, NEXT_DAY)
    expect(progress.lessons[INTRO]).toEqual({
      openedAt: MORNING.toISOString(),
      doneAt: MORNING.toISOString(),
      quiz: { score: 5, total: 5, at: NEXT_DAY.toISOString() },
    })
    expect(progress.activity).toEqual({
      "2026-11-15": [INTRO],
      "2026-11-16": [INTRO],
    })
  })

  it("accepts a score of zero and a full score", () => {
    expect(
      recordQuiz(EMPTY_PROGRESS, INTRO, 0, 1, MORNING).lessons[INTRO]?.quiz
        ?.score
    ).toBe(0)
    expect(
      recordQuiz(EMPTY_PROGRESS, INTRO, 1, 1, MORNING).lessons[INTRO]?.quiz
        ?.score
    ).toBe(1)
  })

  it.each([
    [6, 5],
    [-1, 5],
    [0, 0],
    [1.5, 5],
  ])("rejects an impossible result %d/%d", (score, total) => {
    expect(() =>
      recordQuiz(EMPTY_PROGRESS, INTRO, score, total, MORNING)
    ).toThrow(RangeError)
  })
})
