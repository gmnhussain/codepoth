/**
 * The lesson template's blocks in their fixed order (ADR-0018,
 * docs/content-model.md#lesson-template): MDX component name, the id of the
 * block's section on the page, and whether a published lesson needs it. Kept
 * apart from the remark plugin so pages can import it without the compiler's
 * dependencies.
 */
export const LESSON_BLOCKS = [
  { component: "Concept", id: "concept", required: true },
  { component: "Example", id: "example", required: false },
  { component: "Mistakes", id: "mistakes", required: false },
  { component: "Summary", id: "summary", required: true },
  { component: "Quiz", id: "quiz", required: true },
  { component: "Exercises", id: "exercises", required: true },
  { component: "Practice", id: "practice", required: false },
] as const

/** Id of a lesson block, e.g. "concept". */
export type LessonBlockId = (typeof LESSON_BLOCKS)[number]["id"]

/**
 * Components that sit inside a block (ADR-0018). Where each may sit is
 * checked in `components.ts`; any other component name fails the build.
 */
export const INNER_COMPONENTS = [
  "Note",
  "Tip",
  "Pitfall",
  "Steps",
  "Think",
  "Answer",
  "DeepDive",
  "Exercise",
  "Hint",
  "Solution",
  "Term",
] as const

/**
 * Ids the page adds around the blocks: the goals heading in the header, and
 * the further-reading and prev/next sections after the blocks. Author
 * sections never get them, so a `###` cannot clash with their anchors.
 */
export const GENERATED_SECTIONS = {
  goals: "goals-heading",
  resources: "resources",
  next: "next-heading",
} as const
