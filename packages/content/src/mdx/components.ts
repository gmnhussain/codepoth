import type { Nodes } from "mdast"
import { toString } from "mdast-util-to-string"

import type { LessonBlockId } from "./block-list"
import { INNER_COMPONENTS, LESSON_BLOCKS } from "./block-list"

/** An MDX element: `<Name …>` on its own lines or inside text. */
type JsxElement = Extract<
  Nodes,
  { type: "mdxJsxFlowElement" | "mdxJsxTextElement" }
>

type InnerComponent = (typeof INNER_COMPONENTS)[number]

/** A range of the lesson body, `[start, end)` offsets into its source. */
export type SourceSpan = readonly [start: number, end: number]

/** What the component check reports for one block. */
export type ComponentReport = {
  readonly problems: string[]
  /** Answers, hints and solutions, left out of reading time (ADR-0018). */
  readonly unread: SourceSpan[]
}

/** Allowed only inside Concept. */
const CONCEPT_ONLY: ReadonlySet<string> = new Set([
  "Note",
  "Tip",
  "Pitfall",
  "Steps",
  "Think",
  "DeepDive",
])

/** Collapsed parts that may not sit inside each other. */
const COLLAPSIBLE: ReadonlySet<string> = new Set(["Think", "DeepDive"])

/** Components that must be a direct child of another. */
const PARENT_OF: Readonly<Partial<Record<InnerComponent, string>>> = {
  Answer: "Think",
  Exercise: "Exercises",
  Hint: "Exercise",
  Solution: "Exercise",
}

/** Hidden until the reader opens them, so not counted in reading time. */
const UNREAD: ReadonlySet<string> = new Set(["Answer", "Hint", "Solution"])

/** How many exercises an Exercises block has (ADR-0018). */
export const EXERCISE_COUNT = { min: 2, max: 4 } as const

/** Accepted `level={…}` values of an exercise. */
const LEVELS: ReadonlySet<string> = new Set(["1", "2", "3"])

const BLOCK_NAMES: ReadonlySet<string> = new Set(
  LESSON_BLOCKS.map((block) => block.component)
)
const INNER_NAMES: ReadonlySet<string> = new Set(INNER_COMPONENTS)

/** Where a node sits while the check walks a block. */
type Context = {
  readonly block: LessonBlockId
  /** The component this node is a direct child of, if any. */
  readonly parent: string | undefined
  /** The innermost component (other than Term) the node sits in. */
  readonly inside: string | undefined
  readonly inCollapsible: boolean
}

function isJsx(node: Nodes): node is JsxElement {
  return node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement"
}

function isInner(name: string): name is InnerComponent {
  return INNER_NAMES.has(name)
}

function nameOf(node: JsxElement): string {
  return node.name ?? "fragment"
}

function childrenNamed(node: JsxElement, name: string): JsxElement[] {
  return node.children.filter(
    (child): child is JsxElement => isJsx(child) && child.name === name
  )
}

/** A plain string attribute (`title="…"`), or undefined if missing or empty. */
function stringAttribute(node: JsxElement, name: string): string | undefined {
  const attribute = node.attributes.find(
    (item) => item.type === "mdxJsxAttribute" && item.name === name
  )
  const value = attribute?.value
  return typeof value === "string" && value.trim() !== "" ? value : undefined
}

/** The source of an expression attribute (`level={2}` gives "2"). */
function expressionAttribute(
  node: JsxElement,
  name: string
): string | undefined {
  const attribute = node.attributes.find(
    (item) => item.type === "mdxJsxAttribute" && item.name === name
  )
  const value = attribute?.value
  return typeof value === "object" && value !== null
    ? value.value.trim()
    : undefined
}

/** `<Exercise title="…">`, so a problem says which exercise it means. */
function describe(node: JsxElement): string {
  const title = stringAttribute(node, "title")
  return title === undefined
    ? `<${nameOf(node)}>`
    : `<${nameOf(node)} title="${title}">`
}

/**
 * Checks the components inside one block (ADR-0018): known names only, each
 * in its allowed place, the right counts and attributes, and no heading
 * inside a component. Shape errors are reported for every lesson; a missing
 * part (an answer, a hint, a solution, too few exercises) only for a
 * published one. Also collects the answers, hints and solutions, which
 * reading time leaves out.
 */
export function checkBlockComponents(
  blockNode: JsxElement,
  block: LessonBlockId,
  { isPublished }: { readonly isPublished: boolean },
  report: ComponentReport
): void {
  if (block === "exercises") {
    const count = childrenNamed(blockNode, "Exercise").length
    if (count > EXERCISE_COUNT.max) {
      report.problems.push(
        `<Exercises> has ${String(count)} exercises; it takes at most ${String(EXERCISE_COUNT.max)}`
      )
    } else if (isPublished && count < EXERCISE_COUNT.min) {
      report.problems.push(
        `<Exercises> in a published lesson needs at least ${String(EXERCISE_COUNT.min)} exercises, found ${String(count)}`
      )
    }
  }
  const context: Context = {
    block,
    parent: nameOf(blockNode),
    inside: undefined,
    inCollapsible: false,
  }
  for (const child of blockNode.children) {
    walk(child, context, isPublished, report)
  }
}

function walk(
  node: Nodes,
  context: Context,
  isPublished: boolean,
  report: ComponentReport
): void {
  if (node.type === "heading" && context.inside !== undefined) {
    report.problems.push(
      `heading "${toString(node)}" is inside <${context.inside}>; headings sit directly in a block`
    )
  }
  // Any node that is not a component breaks direct parentage.
  let next: Context = { ...context, parent: undefined }
  if (isJsx(node)) {
    checkElement(node, context, isPublished, report)
    const name = nameOf(node)
    next = {
      block: context.block,
      parent: name,
      inside: name === "Term" ? context.inside : name,
      inCollapsible: context.inCollapsible || COLLAPSIBLE.has(name),
    }
  }
  if ("children" in node) {
    for (const child of node.children) {
      walk(child, next, isPublished, report)
    }
  }
}

function checkElement(
  node: JsxElement,
  context: Context,
  isPublished: boolean,
  report: ComponentReport
): void {
  const name = nameOf(node)
  const { problems } = report
  if (BLOCK_NAMES.has(name)) {
    problems.push(
      `<${name}> is a block; blocks sit at the top level, not inside another block`
    )
    return
  }
  if (!isInner(name)) {
    problems.push(
      `unknown component <${name}>; a lesson uses ${[...BLOCK_NAMES, ...INNER_NAMES].map((item) => `<${item}>`).join(", ")}`
    )
    return
  }
  if (CONCEPT_ONLY.has(name) && context.block !== "concept") {
    problems.push(`<${name}> may only sit inside <Concept>`)
  }
  if (COLLAPSIBLE.has(name) && context.inCollapsible) {
    problems.push(`<${name}> cannot sit inside another <Think> or <DeepDive>`)
  }
  const parent = PARENT_OF[name]
  if (parent !== undefined && context.parent !== parent) {
    problems.push(`<${name}> must sit directly inside <${parent}>`)
  }
  if (UNREAD.has(name)) {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    if (start !== undefined && end !== undefined) {
      report.unread.push([start, end])
    }
  }

  if (name === "DeepDive" && stringAttribute(node, "title") === undefined) {
    problems.push(`<DeepDive> needs a title="…"`)
  }
  if (name === "Think") checkThink(node, isPublished, problems)
  if (name === "Exercise") checkExercise(node, isPublished, problems)
}

function checkThink(
  node: JsxElement,
  isPublished: boolean,
  problems: string[]
): void {
  const answers = childrenNamed(node, "Answer")
  if (answers.length > 1) {
    problems.push(
      `<Think> has ${String(answers.length)} <Answer>s; it takes exactly one`
    )
  } else if (answers.length === 0) {
    if (isPublished) {
      problems.push(`<Think> in a published lesson needs its <Answer>`)
    }
  } else if (node.children.at(-1) !== answers[0]) {
    problems.push(`<Answer> must be the last part of <Think>`)
  }
}

function checkExercise(
  node: JsxElement,
  isPublished: boolean,
  problems: string[]
): void {
  const where = describe(node)
  if (stringAttribute(node, "title") === undefined) {
    problems.push(`<Exercise> needs a title="…"`)
  }
  const level = expressionAttribute(node, "level")
  if (level === undefined || !LEVELS.has(level)) {
    problems.push(`${where} needs level={1}, level={2} or level={3}`)
  }
  const hints = childrenNamed(node, "Hint")
  const solutions = childrenNamed(node, "Solution")
  if (solutions.length > 1) {
    problems.push(
      `${where} has ${String(solutions.length)} <Solution>s; it takes exactly one`
    )
  } else if (solutions.length === 1 && node.children.at(-1) !== solutions[0]) {
    problems.push(
      `${where}: <Solution> must be the last part, after every <Hint>`
    )
  }
  if (isPublished && hints.length === 0) {
    problems.push(`${where} in a published lesson needs at least one <Hint>`)
  }
  if (isPublished && solutions.length === 0) {
    problems.push(`${where} in a published lesson needs its <Solution>`)
  }
}
