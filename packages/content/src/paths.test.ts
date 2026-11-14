import { describe, expect, it } from "vitest"

import {
  lessonUrl,
  parseLessonPath,
  parseMetaPath,
  resolveTopicRef,
  topicKeyOf,
  topicUrl,
} from "./paths"

describe("parseLessonPath", () => {
  it("reads a lesson that sits directly in its topic", () => {
    expect(parseLessonPath("tracks/frontend/a11y/why-a11y.mdx")).toEqual({
      track: "frontend",
      topic: "a11y",
      slug: "why-a11y",
    })
  })

  it("reads a lesson inside a group", () => {
    expect(
      parseLessonPath("tracks/frontend/react/hooks/use-effect.mdx")
    ).toEqual({
      track: "frontend",
      topic: "react",
      group: "hooks",
      slug: "use-effect",
    })
  })

  it("accepts Windows separators", () => {
    expect(parseLessonPath("tracks\\frontend\\a11y\\why-a11y.mdx").slug).toBe(
      "why-a11y"
    )
  })

  it("rejects a lesson nested deeper than a group", () => {
    expect(() =>
      parseLessonPath("tracks/frontend/react/hooks/extra/use-effect.mdx")
    ).toThrow("never deeper")
  })

  it("rejects a lesson directly in a track, outside tracks/, or not .mdx", () => {
    expect(() => parseLessonPath("tracks/frontend/intro.mdx")).toThrow()
    expect(() => parseLessonPath("glossary/side-effect.mdx")).toThrow()
    expect(() => parseLessonPath("tracks/frontend/a11y/why-a11y.md")).toThrow()
  })
  it("rejects an empty or non-kebab-case segment", () => {
    expect(() => parseLessonPath("tracks//react/x.mdx")).toThrow("kebab-case")
    expect(() => parseLessonPath("tracks/frontend/react/.mdx")).toThrow(
      "kebab-case"
    )
    expect(() =>
      parseLessonPath("tracks/frontend/react/hooks/Use_Effect.mdx")
    ).toThrow("kebab-case")
  })
})

describe("parseMetaPath", () => {
  it("tells track, topic and group meta apart", () => {
    expect(parseMetaPath("tracks/frontend/_meta.json")).toEqual({
      level: "track",
      track: "frontend",
    })
    expect(parseMetaPath("tracks/frontend/react/_meta.json")).toEqual({
      level: "topic",
      track: "frontend",
      topic: "react",
    })
    expect(parseMetaPath("tracks/frontend/react/hooks/_meta.json")).toEqual({
      level: "group",
      track: "frontend",
      topic: "react",
      group: "hooks",
    })
  })

  it("rejects an empty or non-kebab-case folder name", () => {
    expect(() => parseMetaPath("tracks//_meta.json")).toThrow("kebab-case")
    expect(() => parseMetaPath("tracks/frontend/React/_meta.json")).toThrow(
      "kebab-case"
    )
  })

  it("rejects meta files that are too deep or not _meta.json", () => {
    expect(() =>
      parseMetaPath("tracks/frontend/react/hooks/extra/_meta.json")
    ).toThrow("too deep")
    expect(() => parseMetaPath("tracks/frontend/meta.json")).toThrow()
    expect(() => parseMetaPath("tracks/_meta.json")).toThrow()
  })
})

describe("resolveTopicRef", () => {
  it("resolves a plain entry to a topic of the home track", () => {
    expect(resolveTopicRef("react", "frontend")).toEqual({
      track: "frontend",
      topic: "react",
      key: "frontend/react",
      isReference: false,
    })
  })

  it("resolves @track/topic to the other track", () => {
    expect(resolveTopicRef("@lang/javascript", "frontend")).toEqual({
      track: "lang",
      topic: "javascript",
      key: "lang/javascript",
      isReference: true,
    })
  })

  it("rejects malformed references", () => {
    expect(() => resolveTopicRef("@lang", "frontend")).toThrow()
    expect(() => resolveTopicRef("@lang/", "frontend")).toThrow()
    expect(() => resolveTopicRef("@lang/js/extra", "frontend")).toThrow()
  })
})

describe("URLs and keys", () => {
  it("builds the topic key and URL", () => {
    expect(topicKeyOf("frontend", "react")).toBe("frontend/react")
    expect(topicUrl("frontend", "react")).toBe("/learn/frontend/react")
  })

  it("leaves the group out of a lesson URL", () => {
    expect(
      lessonUrl({
        track: "frontend",
        topic: "react",
        group: "hooks",
        slug: "use-effect",
      })
    ).toBe("/learn/frontend/react/use-effect")
  })
})
