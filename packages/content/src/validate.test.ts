import { describe, expect, it } from "vitest"

import { fixtureFiles, lesson, must } from "./test-fixtures"
import { termIdsIn, validateContent } from "./validate"

/** Build date used by the tests; the fixture's latest date is 2026-11-12. */
const TODAY = "2026-11-14"

function errorsOf(files: ReturnType<typeof fixtureFiles>): readonly string[] {
  return validateContent(files, TODAY).errors
}

describe("validateContent", () => {
  it("finds no problems in valid content", () => {
    expect(validateContent(fixtureFiles(), TODAY)).toEqual({
      errors: [],
      warnings: [],
    })
  })

  it("accepts dates up to the build date and rejects later ones", () => {
    const files = fixtureFiles()
    files.lessons[0] = {
      ...must(files.lessons[0]),
      published: TODAY,
      updated: TODAY,
    }
    expect(errorsOf(files)).toEqual([])
    files.lessons[0] = {
      ...must(files.lessons[0]),
      published: "2026-11-15",
      updated: "2026-11-15",
    }
    expect(errorsOf(files)).toEqual([
      expect.stringContaining(
        "published 2026-11-15 is after the build date 2026-11-14"
      ),
      expect.stringContaining(
        "updated 2026-11-15 is after the build date 2026-11-14"
      ),
    ])
  })

  it("rejects a duplicate lesson id", () => {
    const files = fixtureFiles()
    files.lessons.push(
      lesson({
        id: "frontend.a11y.why-a11y",
        location: { track: "frontend", topic: "a11y", slug: "aria" },
      })
    )
    files.topics[0] = {
      ...must(files.topics[0]),
      order: ["why-a11y", "semantic-html", "aria"],
    }
    expect(errorsOf(files)).toEqual([
      expect.stringContaining(
        'lesson id "frontend.a11y.why-a11y" is already used'
      ),
    ])
  })

  it("rejects two lessons with the same file name in one topic, even in different groups", () => {
    const files = fixtureFiles()
    files.lessons.push(
      lesson({
        id: "frontend.react.basics.use-state",
        location: {
          track: "frontend",
          topic: "react",
          group: "basics",
          slug: "use-state",
        },
      })
    )
    files.groups[0] = { ...must(files.groups[0]), order: ["jsx", "use-state"] }
    expect(errorsOf(files)).toEqual([
      expect.stringContaining('has the file name "use-state"'),
    ])
  })

  it("requires tracks/_meta.json to list every track exactly once", () => {
    const files = fixtureFiles()
    files.tracksOrder = { order: ["frontend", "frontend", "backend"] }
    expect(errorsOf(files)).toEqual([
      'tracks/_meta.json: "frontend" is listed twice in order',
      'tracks/_meta.json: order lists "backend", which does not exist here',
      'tracks/_meta.json: "lang" is missing from order',
    ])
  })

  it("requires tracks/_meta.json", () => {
    const files = fixtureFiles()
    files.tracksOrder = undefined
    expect(errorsOf(files)).toEqual(["tracks/_meta.json is missing"])
  })

  it("rejects a track referencing its own topic with @", () => {
    const files = fixtureFiles()
    files.tracks[0] = {
      ...must(files.tracks[0]),
      order: ["a11y", "@lang/javascript", "@frontend/react", "react"],
    }
    expect(errorsOf(files)).toEqual([
      'tracks/frontend/_meta.json: "@frontend/react" is in this track; list it as "react"',
    ])
  })

  it("rejects a reference to a topic that does not exist", () => {
    const files = fixtureFiles()
    files.tracks[1] = {
      ...must(files.tracks[1]),
      order: ["javascript", "@frontend/vue"],
    }
    expect(errorsOf(files)).toEqual([
      'tracks/lang/_meta.json: "@frontend/vue" does not exist',
    ])
  })

  it("requires a track to list each of its own topics", () => {
    const files = fixtureFiles()
    files.tracks[0] = {
      ...must(files.tracks[0]),
      order: ["a11y", "@lang/javascript"],
    }
    expect(errorsOf(files)).toEqual([
      'tracks/frontend/_meta.json: "react" is missing from order',
    ])
  })

  it("requires topic and group order to match their folders", () => {
    const files = fixtureFiles()
    files.topics[1] = { ...must(files.topics[1]), order: ["hooks", "advanced"] }
    files.groups[1] = { ...must(files.groups[1]), order: ["use-effect"] }
    expect(errorsOf(files)).toEqual([
      'tracks/frontend/react/_meta.json: order lists "advanced", which does not exist here',
      'tracks/frontend/react/_meta.json: "basics" is missing from order',
      'tracks/frontend/react/hooks/_meta.json: "use-state" is missing from order',
    ])
  })

  it("rejects a lesson whose group folder has no _meta.json", () => {
    const files = fixtureFiles()
    files.lessons.push(
      lesson({
        id: "frontend.react.advanced.suspense",
        location: {
          track: "frontend",
          topic: "react",
          group: "advanced",
          slug: "suspense",
        },
      })
    )
    expect(errorsOf(files)).toEqual([
      expect.stringContaining("the group has no _meta.json"),
    ])
  })

  it("rejects missing prerequisites, glossary terms and Term ids", () => {
    const files = fixtureFiles()
    files.lessons[0] = {
      ...must(files.lessons[0]),
      prerequisites: ["frontend.html.intro"],
      glossary: ["closure"],
      content: '<Term id="hoisting">hoisting</Term>',
    }
    expect(errorsOf(files)).toEqual([
      expect.stringContaining(
        'prerequisite "frontend.html.intro" does not exist'
      ),
      expect.stringContaining('glossary term "closure" does not exist'),
      expect.stringContaining('glossary term "hoisting" does not exist'),
    ])
  })

  it("rejects a published lesson that refers to drafts, but lets a draft do it", () => {
    const files = fixtureFiles()
    files.lessons[4] = { ...must(files.lessons[4]), draft: true }
    files.glossary[0] = { ...must(files.glossary[0]), draft: true }
    expect(errorsOf(files)).toEqual([
      expect.stringContaining(
        'cannot need the draft "frontend.react.hooks.use-state"'
      ),
      expect.stringContaining('cannot use the draft term "side-effect"'),
    ])
    files.lessons[5] = { ...must(files.lessons[5]), draft: true }
    expect(errorsOf(files)).toEqual([])
  })

  it("rejects a glossary entry whose track does not exist", () => {
    const files = fixtureFiles()
    files.glossary[0] = { ...must(files.glossary[0]), track: "fe" }
    expect(errorsOf(files)).toEqual([
      'glossary/side-effect.mdx: track "fe" does not exist',
    ])
  })

  it("rejects map entries for unknown tracks and topics, and requires map.json", () => {
    const files = fixtureFiles()
    files.map = {
      ...must(files.map),
      lines: { ...must(files.map).lines, backend: "1,1 2,2" },
      topics: {
        ...must(files.map).topics,
        "frontend/vue": { x: 1, y: 1, label: "top" },
      },
    }
    expect(errorsOf(files)).toEqual([
      'map.json: line for unknown track "backend"',
      'map.json: unknown topic "frontend/vue"',
    ])
    files.map = undefined
    expect(errorsOf(files)).toEqual(["map.json is missing"])
  })

  it("warns about a topic or track missing from the map", () => {
    const files = fixtureFiles()
    const topics = Object.fromEntries(
      Object.entries(must(files.map).topics).filter(
        ([key]) => key !== "frontend/react"
      )
    )
    files.map = {
      ...must(files.map),
      topics,
      lines: { frontend: must(must(files.map).lines.frontend) },
    }
    expect(validateContent(files, TODAY)).toEqual({
      errors: [],
      warnings: [
        'map.json: topic "frontend/react" has no coordinates and is left off the map',
        'map.json: track "lang" has no line and is left off the map',
      ],
    })
  })

  it("requires start routes to name existing topics, published or not", () => {
    const files = fixtureFiles()
    files.startRoutes = {
      routes: [
        {
          level: "a",
          title: "b",
          description: "c",
          steps: ["@frontend/react", "@frontend/vue"],
        },
      ],
    }
    files.lessons = files.lessons.map((item) => ({ ...item, draft: true }))
    expect(errorsOf(files)).toEqual([
      'start-routes.json: "@frontend/vue" does not exist',
    ])
  })
})

describe("termIdsIn", () => {
  it("finds Term ids with either quote style and extra attributes", () => {
    expect(
      termIdsIn(`<Term id="a">x</Term> and <Term className="y" id='b'>z</Term>`)
    ).toEqual(["a", "b"])
  })
})
