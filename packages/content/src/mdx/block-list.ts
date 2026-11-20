/**
 * The lesson template's blocks in their required order (ADR-0009,
 * docs/content-model.md#lesson-template): MDX component name, the id of
 * the block's section on the page, and whether a published lesson needs it
 * (ADR-0018 makes some blocks optional). Kept apart from the remark plugin so pages
 * can import it without the compiler's dependencies.
 */
export const LESSON_BLOCKS = [
  { component: "Summary", id: "summary", required: true },
  { component: "Concept", id: "concept", required: true },
  { component: "Example", id: "example", required: true },
  { component: "Mistakes", id: "mistakes", required: true },
  { component: "DeepDive", id: "deep-dive", required: true },
  { component: "Practice", id: "practice", required: true },
  { component: "Quiz", id: "quiz", required: true },
  { component: "Exercises", id: "exercises", required: false },
] as const

/** Id of a lesson block, e.g. "concept". */
export type LessonBlockId = (typeof LESSON_BLOCKS)[number]["id"]
