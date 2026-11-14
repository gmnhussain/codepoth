import { describe, expect, it } from "vitest"

import {
  buildContentGraph,
  ContentValidationError,
  freshnessOf,
  loadContent,
  neighboursOf,
  recentLessons,
} from "./graph"
import { fixtureFiles, must } from "./test-fixtures"

const withDrafts = { includeDrafts: true }
const withoutDrafts = { includeDrafts: false }

function graphOf(files = fixtureFiles(), options = withoutDrafts) {
  return buildContentGraph(files, options)
}

describe("tracks", () => {
  it("are numbered by tracks/_meta.json and list own and referenced topics", () => {
    expect(
      graphOf().tracks.map((track) => [track.id, track.number, track.topicKeys])
    ).toEqual([
      ["frontend", 1, ["frontend/a11y", "lang/javascript", "frontend/react"]],
      ["lang", 2, ["lang/javascript"]],
    ])
  })
})

describe("topics", () => {
  it("marks a topic on two tracks as an interchange, home track first", () => {
    const javascript = must(graphOf().topicByKey.get("lang/javascript"))
    expect(javascript.trackIds).toEqual(["lang", "frontend"])
    expect(javascript.isInterchange).toBe(true)
    expect(must(graphOf().topicByKey.get("frontend/a11y")).isInterchange).toBe(
      false
    )
  })

  it("keeps groups and loose lessons in order and flattens lessons", () => {
    const react = must(graphOf().topicByKey.get("frontend/react"))
    expect(react.entries).toEqual([
      { kind: "group", groupKey: "frontend/react/basics" },
      { kind: "group", groupKey: "frontend/react/hooks" },
    ])
    expect(react.lessonIds).toEqual([
      "frontend.react.basics.jsx",
      "frontend.react.hooks.use-state",
      "frontend.react.hooks.use-effect",
    ])
    expect(react.url).toBe("/learn/frontend/react")
    expect(react.prerequisites).toEqual(["lang/javascript"])
  })

  it("sums reading time over its lessons and groups", () => {
    const graph = graphOf()
    const hooks = must(graph.groupByKey.get("frontend/react/hooks"))
    expect(hooks.readingMinutes).toBe(2)
    expect(must(graph.topicByKey.get("frontend/react")).readingMinutes).toBe(3)
  })
})

describe("lessons", () => {
  it("get a URL without the group, and numbers in topic and group", () => {
    const useEffect = must(
      graphOf().lessonById.get("frontend.react.hooks.use-effect")
    )
    expect(useEffect).toMatchObject({
      url: "/learn/frontend/react/use-effect",
      topicKey: "frontend/react",
      groupKey: "frontend/react/hooks",
      numberInTopic: 3,
      numberInGroup: 2,
      readingMinutes: 1,
    })
    expect(useEffect).not.toHaveProperty("location")
  })
})

describe("drafts", () => {
  function filesWithDraftHooks() {
    const files = fixtureFiles()
    files.lessons = files.lessons.map((item) =>
      item.location.group === "hooks" ? { ...item, draft: true } : item
    )
    files.glossary = files.glossary.map((term) => ({ ...term, draft: true }))
    return files
  }

  it("are left out without the flag: empty groups disappear, counts follow", () => {
    const graph = graphOf(filesWithDraftHooks(), withoutDrafts)
    expect(graph.groupByKey.has("frontend/react/hooks")).toBe(false)
    expect(must(graph.topicByKey.get("frontend/react")).lessonIds).toEqual([
      "frontend.react.basics.jsx",
    ])
    expect(graph.glossary).toEqual([])
    expect(graph.stats).toEqual({
      tracks: 2,
      topics: 3,
      lessons: 4,
      quizQuestions: 12,
    })
  })

  it("are included with the flag", () => {
    expect(graphOf(filesWithDraftHooks(), withDrafts).stats.lessons).toBe(6)
  })

  it("leave a topic without published lessons as planned, with no page", () => {
    const files = fixtureFiles()
    files.lessons = files.lessons.map((item) => ({ ...item, draft: true }))
    const graph = graphOf(files, withoutDrafts)
    expect(
      [...graph.topicByKey.values()].map((topic) => topic.hasPage)
    ).toEqual([false, false, false])
    expect(graph.stats).toEqual({
      tracks: 2,
      topics: 3,
      lessons: 0,
      quizQuestions: 0,
    })
  })
})

describe("glossary", () => {
  it("lists the lessons that use each term", () => {
    expect(graphOf().glossary.map((term) => [term.id, term.lessonIds])).toEqual(
      [["side-effect", ["frontend.react.hooks.use-effect"]]]
    )
  })
})

describe("neighboursOf", () => {
  const graph = graphOf()

  it("moves within a group", () => {
    expect(neighboursOf(graph, "frontend.react.hooks.use-state")).toEqual({
      previous: {
        lessonId: "frontend.react.basics.jsx",
        isOtherGroup: true,
        isOtherTopic: false,
      },
      next: {
        lessonId: "frontend.react.hooks.use-effect",
        isOtherGroup: false,
        isOtherTopic: false,
      },
    })
  })

  it("crosses into the previous topic on the home track, including referenced topics", () => {
    expect(neighboursOf(graph, "frontend.react.basics.jsx").previous).toEqual({
      lessonId: "lang.javascript.variables",
      isOtherGroup: true,
      isOtherTopic: true,
    })
  })

  it("has no previous lesson at the start or next lesson at the end of a track", () => {
    expect(
      neighboursOf(graph, "frontend.a11y.why-a11y").previous
    ).toBeUndefined()
    expect(
      neighboursOf(graph, "frontend.react.hooks.use-effect").next
    ).toBeUndefined()
  })

  it("follows the lesson's own track for a topic on several tracks", () => {
    expect(neighboursOf(graph, "lang.javascript.variables")).toEqual({
      previous: undefined,
      next: undefined,
    })
  })

  it("throws for an unknown lesson", () => {
    expect(() => neighboursOf(graph, "nope.nope")).toThrow("Unknown lesson")
  })
})

describe("freshness", () => {
  it("is new within 30 days of publishing, then updated within 30 days of an update", () => {
    expect(
      freshnessOf(
        { published: "2026-11-01", updated: "2026-11-01" },
        "2026-12-01"
      )
    ).toBe("new")
    expect(
      freshnessOf(
        { published: "2026-10-01", updated: "2026-11-20" },
        "2026-12-01"
      )
    ).toBe("updated")
    expect(
      freshnessOf(
        { published: "2026-10-01", updated: "2026-10-01" },
        "2026-12-01"
      )
    ).toBeUndefined()
  })

  it("orders recent lessons by their latest date", () => {
    expect(recentLessons(graphOf(), 2).map((item) => item.id)).toEqual([
      "frontend.react.hooks.use-effect",
      "frontend.a11y.semantic-html",
    ])
  })
})

describe("loadContent", () => {
  it("throws every cross-file error at once", () => {
    const files = fixtureFiles()
    files.tracksOrder = undefined
    files.map = undefined
    expect(() => loadContent(files, withoutDrafts, "2026-11-14")).toThrow(
      ContentValidationError
    )
    expect(() => loadContent(files, withoutDrafts, "2026-11-14")).toThrow(
      /tracks\/_meta.json is missing[\s\S]*map.json is missing/
    )
  })
})
