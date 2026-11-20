/**
 * Lesson bodies for the compiler's unit tests, in the template v2 order
 * (ADR-0018). Each part is a string, so a test can replace or drop one.
 */

/** An exercise with one hint and its solution. */
export function exercise(
  title = "কাজ",
  { level = "{1}", hints = 1 }: { level?: string; hints?: number } = {}
): string {
  const hintParts = Array.from(
    { length: hints },
    (_, index) => `<Hint>ইঙ্গিত ${String(index + 1)}।</Hint>`
  )
  return [
    `<Exercise title="${title}" level=${level}>`,
    "করে দেখো।",
    ...hintParts,
    "<Solution>\n\nসমাধান।\n\n</Solution>",
    "</Exercise>",
  ].join("\n\n")
}

/** An Exercises block holding the given exercises. */
export function exercises(...items: readonly string[]): string {
  return ["<Exercises>", ...items, "</Exercises>"].join("\n\n")
}

/** Every block, in order, each in its smallest valid published form. */
export const BLOCKS = {
  concept: "<Concept>\n\nধারণা।\n\n### প্রথম অংশ\n\nলেখা।\n\n</Concept>",
  example:
    '<Example>\n\n### উদাহরণের অংশ\n\n```js title="a.js"\nconst a = 1\n```\n\n</Example>',
  mistakes: "<Mistakes>\n\n1. ভুল\n\n</Mistakes>",
  summary: "<Summary>\n\n- এক\n\n</Summary>",
  quiz: "<Quiz />",
  exercises: exercises(exercise("এক"), exercise("দুই")),
  practice: "<Practice>\n\n- prompt\n\n</Practice>",
} as const

export type TestBlock = keyof typeof BLOCKS

/** A lesson body from the blocks, with some replaced or left out. */
export function lessonBody(
  overrides: Partial<Record<TestBlock, string | null>> = {}
): string {
  return (Object.keys(BLOCKS) as TestBlock[])
    .map((block) =>
      Object.hasOwn(overrides, block) ? overrides[block] : BLOCKS[block]
    )
    .filter((part): part is string => typeof part === "string")
    .join("\n\n")
}

/** A Concept block with the given body. */
export function concept(body: string): string {
  return `<Concept>\n\n${body}\n\n</Concept>`
}
