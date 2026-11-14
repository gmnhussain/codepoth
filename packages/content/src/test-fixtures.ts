import type { ContentFiles, LessonFile } from "./files"
import type { LessonFrontmatter } from "./schemas/lesson.schema"

/**
 * A small, valid content tree for unit tests: two tracks, an interchange
 * topic, a grouped topic and a topic with loose lessons.
 *
 *   tracks order: frontend, lang
 *   frontend: a11y, @lang/javascript, react (basics: jsx | hooks: use-state, use-effect)
 *   lang:     javascript (variables)
 */

const QUIZ = [1, 2, 3].map((index) => ({
  question: `প্রশ্ন ${String(index)}`,
  options: ["ক", "খ"],
  answer: 0,
  explanation: "কারণ।",
}))

type LessonInput = Partial<LessonFrontmatter> & {
  readonly id: string
  readonly location: LessonFile["location"]
  readonly content?: string
}

/** Returns `value`, or throws if it is undefined (tests use it instead of `!`). */
export function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Expected a value")
  return value
}

/** A published lesson with sensible defaults. */
export function lesson(input: LessonInput): LessonFile {
  return {
    title: input.id,
    description: "বর্ণনা।",
    published: "2026-11-01",
    updated: "2026-11-01",
    level: "beginner",
    draft: false,
    glossary: [],
    prerequisites: [],
    previousSlugs: [],
    quiz: QUIZ,
    content: "কয়েকটা শব্দ।",
    ...input,
  }
}

/** A fresh copy of the fixture; tests change it freely. */
export function fixtureFiles(): {
  -readonly [
    K in keyof ContentFiles
  ]: ContentFiles[K] extends readonly (infer T)[] ? T[] : ContentFiles[K]
} {
  return {
    tracksOrder: { order: ["frontend", "lang"] },
    tracks: [
      {
        title: "ইন্টারফেস বানানো",
        titleEn: "Frontend",
        color: "indigo",
        order: ["a11y", "@lang/javascript", "react"],
        location: { level: "track", track: "frontend" },
      },
      {
        title: "প্রোগ্রামিং ভাষা",
        titleEn: "Languages",
        color: "orange",
        order: ["javascript"],
        location: { level: "track", track: "lang" },
      },
    ],
    topics: [
      {
        title: "Accessibility",
        description: "সবার জন্য।",
        start: true,
        order: ["why-a11y", "semantic-html"],
        prerequisites: [],
        location: { level: "topic", track: "frontend", topic: "a11y" },
      },
      {
        title: "React",
        description: "UI লাইব্রেরি।",
        order: ["basics", "hooks"],
        prerequisites: ["@lang/javascript"],
        location: { level: "topic", track: "frontend", topic: "react" },
      },
      {
        title: "JavaScript",
        description: "ওয়েবের ভাষা।",
        order: ["variables"],
        prerequisites: [],
        location: { level: "topic", track: "lang", topic: "javascript" },
      },
    ],
    groups: [
      {
        title: "শুরু",
        description: "প্রথম ধাপ।",
        order: ["jsx"],
        location: {
          level: "group",
          track: "frontend",
          topic: "react",
          group: "basics",
        },
      },
      {
        title: "Hooks",
        description: "State আর effect।",
        order: ["use-state", "use-effect"],
        location: {
          level: "group",
          track: "frontend",
          topic: "react",
          group: "hooks",
        },
      },
    ],
    lessons: [
      lesson({
        id: "frontend.a11y.why-a11y",
        location: { track: "frontend", topic: "a11y", slug: "why-a11y" },
      }),
      lesson({
        id: "frontend.a11y.semantic-html",
        location: { track: "frontend", topic: "a11y", slug: "semantic-html" },
      }),
      lesson({
        id: "lang.javascript.variables",
        location: { track: "lang", topic: "javascript", slug: "variables" },
      }),
      lesson({
        id: "frontend.react.basics.jsx",
        location: {
          track: "frontend",
          topic: "react",
          group: "basics",
          slug: "jsx",
        },
      }),
      lesson({
        id: "frontend.react.hooks.use-state",
        location: {
          track: "frontend",
          topic: "react",
          group: "hooks",
          slug: "use-state",
        },
      }),
      lesson({
        id: "frontend.react.hooks.use-effect",
        updated: "2026-11-12",
        glossary: ["side-effect"],
        prerequisites: ["frontend.react.hooks.use-state"],
        content: 'Render-এর পরে <Term id="side-effect">side effect</Term> চলে।',
        location: {
          track: "frontend",
          topic: "react",
          group: "hooks",
          slug: "use-effect",
        },
      }),
    ],
    glossary: [
      {
        id: "side-effect",
        term: "Side effect",
        termBn: "সাইড ইফেক্ট",
        track: "frontend",
        draft: false,
        content: "সংজ্ঞা।",
      },
    ],
    map: {
      width: 1400,
      height: 880,
      lines: { frontend: "400,100 400,440", lang: "160,240 960,240" },
      topics: {
        "frontend/a11y": { x: 400, y: 170, label: "left" },
        "frontend/react": { x: 400, y: 360, label: "left" },
        "lang/javascript": { x: 400, y: 240, label: "top" },
      },
    },
    startRoutes: {
      routes: [
        {
          level: "শুরুর ধাপ",
          title: "একদম নতুন",
          description: "শুরু।",
          steps: ["@frontend/a11y", { label: "যেকোনো" }],
        },
      ],
    },
  }
}
