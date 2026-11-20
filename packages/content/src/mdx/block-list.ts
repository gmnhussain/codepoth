/**
 * The lesson template's blocks in their required order (ADR-0009,
 * docs/content-model.md#lesson-template): MDX component name and the id of
 * the block's section on the page. Kept apart from the remark plugin so pages
 * can import it without the compiler's dependencies.
 */
export const LESSON_BLOCKS = [
  { component: "Summary", id: "summary" },
  { component: "Concept", id: "concept" },
  { component: "Example", id: "example" },
  { component: "Mistakes", id: "mistakes" },
  { component: "DeepDive", id: "deep-dive" },
  { component: "Practice", id: "practice" },
  { component: "Quiz", id: "quiz" },
] as const

/** Id of a lesson block, e.g. "concept". */
export type LessonBlockId = (typeof LESSON_BLOCKS)[number]["id"]
