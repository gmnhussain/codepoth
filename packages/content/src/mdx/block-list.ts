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

/** Blocks shown with a number; the summary has none. */
const NUMBERED_BLOCKS: readonly LessonBlockId[] = LESSON_BLOCKS.map(
  (block) => block.id
).filter((id) => id !== "summary")

/** 1-based number of a block on the page, or undefined for the summary. */
export function blockNumberOf(block: LessonBlockId): number | undefined {
  const index = NUMBERED_BLOCKS.indexOf(block)
  return index === -1 ? undefined : index + 1
}

/** Number of the generated prev/next section that follows the blocks. */
export const NEXT_SECTION_NUMBER = NUMBERED_BLOCKS.length + 1
