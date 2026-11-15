import { describe, expect, it } from "vitest"

import { EMPTY_PROGRESS } from "./empty-progress"
import type { Progress } from "./progress.schema"
import { parseResumeIndex, resumeOf } from "./resume"
import type { ResumeIndex } from "./resume"

const T = "2026-11-10T08:00:00.000Z"
const JSX = "frontend.react.basics.jsx"
const PROPS = "frontend.react.basics.props"
const LOOSE = "tools.git.intro"

const index: ResumeIndex = {
  lessons: {
    [JSX]: { title: "JSX", url: "/learn/frontend/react/jsx", scope: "g" },
    [PROPS]: { title: "Props", url: "/learn/frontend/react/props", scope: "g" },
    [LOOSE]: { title: "Git", url: "/learn/tools/git/intro", scope: "t" },
  },
  scopes: {
    g: { title: "শুরু", isGroup: true, lessonIds: [JSX, PROPS] },
    t: { title: "Git", isGroup: false, lessonIds: [LOOSE] },
  },
}

const reading: Progress = {
  ...EMPTY_PROGRESS,
  lessons: { [JSX]: { openedAt: T, doneAt: T }, [PROPS]: { openedAt: T } },
  lastRead: { id: PROPS, at: T, anchor: "props-কী" },
}

describe("resumeOf", () => {
  it("is undefined before anything is read", () => {
    expect(resumeOf(EMPTY_PROGRESS, index)).toBeUndefined()
  })

  it("is undefined when the last-read lesson is not in the index", () => {
    const gone: Progress = {
      ...EMPTY_PROGRESS,
      lastRead: { id: "removed.topic.lesson", at: T },
    }
    expect(resumeOf(gone, index)).toBeUndefined()
  })

  it("is undefined when the lesson's scope is missing", () => {
    const broken: ResumeIndex = { ...index, scopes: {} }
    expect(resumeOf(reading, broken)).toBeUndefined()
  })

  it("links to the saved section, encoded, with the group's progress", () => {
    expect(resumeOf(reading, index)).toEqual({
      title: "Props",
      href: "/learn/frontend/react/props#props-%E0%A6%95%E0%A7%80",
      scope: { title: "শুরু", isGroup: true, done: 1, total: 2 },
    })
  })

  it("links to the lesson itself without a saved section", () => {
    const top: Progress = { ...reading, lastRead: { id: JSX, at: T } }
    expect(resumeOf(top, index)?.href).toBe("/learn/frontend/react/jsx")
  })

  it("uses the topic for a lesson outside any group", () => {
    const loose: Progress = {
      ...EMPTY_PROGRESS,
      lessons: { [LOOSE]: { openedAt: T } },
      lastRead: { id: LOOSE, at: T },
    }
    expect(resumeOf(loose, index)?.scope).toEqual({
      title: "Git",
      isGroup: false,
      done: 0,
      total: 1,
    })
  })
})

describe("parseResumeIndex", () => {
  it("accepts a valid index, including an empty one", () => {
    expect(parseResumeIndex(index)).toBe(index)
    expect(parseResumeIndex({ lessons: {}, scopes: {} })).toEqual({
      lessons: {},
      scopes: {},
    })
  })

  it.each([
    ["null", null],
    ["an array", []],
    ["a string", "lessons"],
    ["no scopes", { lessons: index.lessons }],
    [
      "a lesson without a URL",
      { ...index, lessons: { [JSX]: { title: "JSX", scope: "g" } } },
    ],
    [
      "an absolute URL",
      {
        ...index,
        lessons: {
          [JSX]: { title: "JSX", url: "https://example.com", scope: "g" },
        },
      },
    ],
    [
      "lesson ids that are not a list",
      {
        ...index,
        scopes: { g: { title: "g", isGroup: true, lessonIds: "x" } },
      },
    ],
    [
      "a non-string lesson id",
      {
        ...index,
        scopes: { g: { title: "g", isGroup: true, lessonIds: [1] } },
      },
    ],
  ])("rejects %s", (_, value) => {
    expect(parseResumeIndex(value)).toBeUndefined()
  })
})
