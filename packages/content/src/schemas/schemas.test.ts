import { describe, expect, it } from "vitest"

import { glossaryTermSchema } from "./glossary-term.schema"
import { groupMetaSchema } from "./group-meta.schema"
import { lessonFrontmatterSchema } from "./lesson.schema"
import { mapSchema } from "./map.schema"
import { startRoutesSchema } from "./start-routes.schema"
import { topicMetaSchema } from "./topic-meta.schema"
import { trackMetaSchema } from "./track-meta.schema"

const question = {
  question: "useEffect(fn, []) কখন চলে?",
  options: ["প্রতিটা render-এর পরে", "শুধু প্রথমবার mount হওয়ার পরে"],
  answer: 1,
  explanation: "খালি dependency array মানে effect একবার চলে।",
}

const lesson = {
  id: "frontend.react.hooks.use-effect",
  title: "useEffect ও Side Effects",
  description: "Render-এর পরে বাইরের দুনিয়ার সাথে কাজ করার জায়গা।",
  published: "2026-11-12",
  updated: "2026-11-12",
  level: "beginner",
  quiz: [question, question, question],
}

/** A copy of `value` without `key`. */
function without<T extends object>(value: T, key: keyof T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([name]) => name !== key)
  ) as Partial<T>
}

function issuePaths(result: {
  error?: { issues: { path: PropertyKey[] }[] }
}): string[] {
  return (result.error?.issues ?? []).map((issue) => issue.path.join("."))
}

describe("lessonFrontmatterSchema", () => {
  it("accepts a published lesson and fills the defaults", () => {
    expect(lessonFrontmatterSchema.parse(lesson)).toMatchObject({
      draft: false,
      glossary: [],
      prerequisites: [],
      previousSlugs: [],
    })
  })

  it("requires published unless the lesson is a draft", () => {
    const unpublished = without(lesson, "published")
    expect(issuePaths(lessonFrontmatterSchema.safeParse(unpublished))).toEqual([
      "published",
    ])
    expect(
      lessonFrontmatterSchema.safeParse({ ...unpublished, draft: true }).success
    ).toBe(true)
  })

  it("accepts a draft stub without published or quiz", () => {
    const stub = without(without(lesson, "published"), "quiz")
    expect(issuePaths(lessonFrontmatterSchema.safeParse(stub))).toEqual([
      "published",
      "quiz",
    ])
    expect(
      lessonFrontmatterSchema.safeParse({ ...stub, draft: true }).success
    ).toBe(true)
  })

  it("rejects updated before published", () => {
    const result = lessonFrontmatterSchema.safeParse({
      ...lesson,
      updated: "2026-11-11",
    })
    expect(issuePaths(result)).toEqual(["updated"])
  })

  it("accepts 3 to 5 quiz questions and nothing outside that", () => {
    for (const count of [3, 5]) {
      const quiz = Array.from({ length: count }, () => question)
      expect(
        lessonFrontmatterSchema.safeParse({ ...lesson, quiz }).success
      ).toBe(true)
    }
    for (const count of [2, 6]) {
      const quiz = Array.from({ length: count }, () => question)
      expect(
        lessonFrontmatterSchema.safeParse({ ...lesson, quiz }).success
      ).toBe(false)
    }
  })

  it("rejects an answer that is not an index into the options", () => {
    const quiz = [question, question, { ...question, answer: 2 }]
    expect(
      issuePaths(lessonFrontmatterSchema.safeParse({ ...lesson, quiz }))
    ).toEqual(["quiz.2.answer"])
  })

  it("accepts 2 to 4 options per question", () => {
    const five = { ...question, options: ["a", "b", "c", "d", "e"] }
    const one = { ...question, options: ["a"], answer: 0 }
    expect(
      lessonFrontmatterSchema.safeParse({
        ...lesson,
        quiz: [question, question, five],
      }).success
    ).toBe(false)
    expect(
      lessonFrontmatterSchema.safeParse({
        ...lesson,
        quiz: [question, question, one],
      }).success
    ).toBe(false)
  })

  it("rejects malformed ids, dates, unknown keys and bad previous slugs", () => {
    expect(
      lessonFrontmatterSchema.safeParse({ ...lesson, id: "use-effect" }).success
    ).toBe(false)
    expect(
      lessonFrontmatterSchema.safeParse({ ...lesson, id: "Frontend.React" })
        .success
    ).toBe(false)
    expect(
      lessonFrontmatterSchema.safeParse({ ...lesson, updated: "2026-02-30" })
        .success
    ).toBe(false)
    expect(
      lessonFrontmatterSchema.safeParse({ ...lesson, readingTime: 5 }).success
    ).toBe(false)
    expect(
      lessonFrontmatterSchema.safeParse({
        ...lesson,
        previousSlugs: ["/learn/frontend/react/hooks/use-effect"],
      }).success
    ).toBe(false)
    expect(
      lessonFrontmatterSchema.safeParse({
        ...lesson,
        previousSlugs: ["/learn/frontend/react/old-name"],
      }).success
    ).toBe(true)
  })
})

describe("meta schemas", () => {
  it("accepts a track with own topics and references", () => {
    const track = {
      title: "ইন্টারফেস বানানো",
      titleEn: "Frontend",
      color: "indigo",
      order: ["html-css", "@lang/javascript"],
    }
    expect(trackMetaSchema.safeParse(track).success).toBe(true)
  })

  it("rejects a track without titleEn, with an unknown hue or an empty order", () => {
    const track = {
      title: "ইন্টারফেস বানানো",
      titleEn: "Frontend",
      color: "indigo",
      order: ["react"],
    }
    const withoutTitleEn = without(track, "titleEn")
    expect(trackMetaSchema.safeParse(withoutTitleEn).success).toBe(false)
    expect(
      trackMetaSchema.safeParse({ ...track, color: "#3E63DD" }).success
    ).toBe(false)
    expect(trackMetaSchema.safeParse({ ...track, order: [] }).success).toBe(
      false
    )
  })

  it("requires a topic description and allows only start: true", () => {
    const topic = {
      title: "React",
      description: "UI বানানোর লাইব্রেরি।",
      order: ["hooks"],
    }
    expect(topicMetaSchema.parse(topic).prerequisites).toEqual([])
    expect(topicMetaSchema.safeParse({ ...topic, start: true }).success).toBe(
      true
    )
    expect(topicMetaSchema.safeParse({ ...topic, start: false }).success).toBe(
      false
    )
    expect(
      topicMetaSchema.safeParse({ ...topic, description: " " }).success
    ).toBe(false)
  })

  it("requires a group description", () => {
    expect(
      groupMetaSchema.safeParse({ title: "Hooks", order: ["use-state"] })
        .success
    ).toBe(false)
  })
})

describe("glossaryTermSchema", () => {
  it("accepts a term and defaults draft to false", () => {
    expect(
      glossaryTermSchema.parse({
        term: "Side effect",
        termBn: "সাইড ইফেক্ট",
        track: "frontend",
      }).draft
    ).toBe(false)
  })
})

describe("mapSchema", () => {
  const map = {
    width: 1400,
    height: 880,
    lines: { frontend: "400,100 400,440" },
    topics: { "frontend/react": { x: 400, y: 360, label: "left" } },
  }

  it("accepts a map", () => {
    expect(mapSchema.safeParse(map).success).toBe(true)
  })

  it("rejects a line with one point, a bad topic key and a topic outside the map", () => {
    expect(
      mapSchema.safeParse({ ...map, lines: { frontend: "400,100" } }).success
    ).toBe(false)
    expect(
      mapSchema.safeParse({
        ...map,
        topics: { react: { x: 1, y: 1, label: "top" } },
      }).success
    ).toBe(false)
    expect(
      mapSchema.safeParse({
        ...map,
        topics: { "frontend/react": { x: 1500, y: 1, label: "top" } },
      }).success
    ).toBe(false)
  })
})

describe("startRoutesSchema", () => {
  it("accepts topic references and free labels as steps", () => {
    const routes = [
      {
        level: "শুরুর ধাপ",
        title: "একদম নতুন",
        description: "…",
        steps: ["@frontend/html-css", { label: "যেকোনো লাইন" }],
      },
    ]
    expect(startRoutesSchema.safeParse({ routes }).success).toBe(true)
  })

  it("rejects a plain topic name as a step and an empty list", () => {
    expect(
      startRoutesSchema.safeParse({
        routes: [
          { level: "a", title: "b", description: "c", steps: ["react"] },
        ],
      }).success
    ).toBe(false)
    expect(startRoutesSchema.safeParse({ routes: [] }).success).toBe(false)
    expect(startRoutesSchema.safeParse([]).success).toBe(false)
  })
})
