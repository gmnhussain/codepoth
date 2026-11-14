import { describe, expect, it } from "vitest"

import { lessonUrl as pathsLessonUrl } from "./paths"
import { lessonRedirects } from "./redirects"
import { fixtureFiles, lesson, must } from "./test-fixtures"

const moved = lesson({
  id: "frontend.react.hooks.use-effect",
  previousSlugs: ["/learn/frontend/react/effects"],
  location: {
    track: "frontend",
    topic: "react",
    group: "hooks",
    slug: "use-effect",
  },
})

describe("lessonRedirects", () => {
  it("turns each previous path into a permanent redirect to the current URL", () => {
    expect(lessonRedirects([moved], { includeDrafts: false })).toEqual([
      {
        source: "/learn/frontend/react/effects",
        destination: "/learn/frontend/react/use-effect",
        permanent: true,
      },
    ])
  })

  it("uses the same lesson URL as paths.ts", () => {
    const lessons = fixtureFiles().lessons.map((item) => ({
      ...item,
      previousSlugs: [
        `/learn/old/${item.location.topic}/${item.location.slug}`,
      ],
    }))
    for (const redirect of lessonRedirects(lessons, { includeDrafts: false })) {
      const target = must(
        lessons.find((item) =>
          redirect.source.endsWith(
            `/${item.location.topic}/${item.location.slug}`
          )
        )
      )
      expect(redirect.destination).toBe(pathsLessonUrl(target.location))
    }
  })

  it("is empty when no lesson has moved", () => {
    expect(
      lessonRedirects([{ ...moved, previousSlugs: [] }], {
        includeDrafts: false,
      })
    ).toEqual([])
  })

  it("leaves out drafts unless the build includes them", () => {
    const draft = { ...moved, draft: true }
    expect(lessonRedirects([draft], { includeDrafts: false })).toEqual([])
    expect(lessonRedirects([draft], { includeDrafts: true })).toHaveLength(1)
  })

  it("fails when an old path is a live lesson URL", () => {
    const live = lesson({
      id: "frontend.react.effects",
      location: { track: "frontend", topic: "react", slug: "effects" },
    })
    expect(() =>
      lessonRedirects([moved, live], { includeDrafts: false })
    ).toThrow(/URL of a live lesson/)
  })

  it("fails when two lessons claim the same old path", () => {
    const other = lesson({
      id: "frontend.react.hooks.use-state",
      previousSlugs: ["/learn/frontend/react/effects"],
      location: {
        track: "frontend",
        topic: "react",
        group: "hooks",
        slug: "use-state",
      },
    })
    expect(() =>
      lessonRedirects([moved, other], { includeDrafts: false })
    ).toThrow(/also claimed by frontend.react.hooks.use-effect/)
  })
})
