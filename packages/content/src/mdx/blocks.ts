import GithubSlugger from "github-slugger"
import type { Heading, Root, RootContent } from "mdast"
import { toString } from "mdast-util-to-string"
import { visit } from "unist-util-visit"

import type { LessonBlockId } from "./block-list"
import { LESSON_BLOCKS } from "./block-list"

/** An author section: a `###` heading and the block it sits in. */
export type LessonSection = {
  readonly id: string
  readonly title: string
  readonly block: LessonBlockId
}

/** The parts of a VFile this plugin uses. */
type CompileFile = {
  data: Record<string, unknown>
  fail: (reason: string) => never
}

const blockIdByComponent = new Map<string, LessonBlockId>(
  LESSON_BLOCKS.map((block) => [block.component, block.id])
)

/** Block id of a top-level MDX element, if it is a template block. */
function blockOf(node: RootContent): LessonBlockId | undefined {
  if (node.type !== "mdxJsxFlowElement" || node.name === null) return undefined
  return blockIdByComponent.get(node.name)
}

/** Nodes that may sit outside a block: imports/exports and blank text. */
function isNeutral(node: RootContent): boolean {
  return node.type === "mdxjsEsm" || node.type === "mdxFlowExpression"
}

/**
 * Remark plugin: checks the block structure, gives every author `###` a
 * stable id and stores the sections on `file.data.sections`. Structure rules
 * apply to every lesson; completeness (all seven blocks, nothing outside a
 * block) only to published lessons, since a draft may be a stub (ADR-0009).
 */
export function remarkLessonBlocks({
  isPublished,
}: {
  readonly isPublished: boolean
}) {
  return (tree: Root, file: CompileFile): void => {
    const problems: string[] = []
    const slugger = new GithubSlugger()
    for (const block of LESSON_BLOCKS) slugger.slug(block.id)

    const sections: LessonSection[] = []
    const seen: LessonBlockId[] = []
    const order = LESSON_BLOCKS.map((block) => block.id)

    for (const node of tree.children) {
      const block = blockOf(node)
      if (block === undefined) {
        if (isNeutral(node)) continue
        if (node.type === "heading") {
          problems.push(
            `heading "${toString(node)}" is outside a block; author sections are ### inside a block`
          )
        } else if (isPublished) {
          problems.push(`a published lesson has ${node.type} outside a block`)
        }
        continue
      }
      if (seen.includes(block)) {
        problems.push(`block <${componentOf(block)}> appears twice`)
      }
      const previous = seen.at(-1)
      if (
        previous !== undefined &&
        order.indexOf(block) < order.indexOf(previous)
      ) {
        problems.push(
          `block <${componentOf(block)}> comes after <${componentOf(previous)}>; the order is ${LESSON_BLOCKS.map((item) => item.component).join(", ")}`
        )
      }
      seen.push(block)

      visit(node, "heading", (heading: Heading) => {
        const title = toString(heading)
        if (heading.depth < 3) {
          problems.push(
            `"${title}" is a level-${String(heading.depth)} heading; blocks render h2, so author sections start at ###`
          )
          return
        }
        if (heading.depth > 3) return
        const id = slugger.slug(title)
        heading.data = {
          ...heading.data,
          hProperties: { ...heading.data?.hProperties, id },
        }
        sections.push({ id, title, block })
      })
    }

    if (isPublished) {
      for (const block of LESSON_BLOCKS) {
        if (!seen.includes(block.id)) {
          problems.push(`a published lesson needs <${block.component}>`)
        }
      }
    }

    if (problems.length > 0) file.fail(problems.join("; "))
    file.data.sections = sections
    file.data.blocks = seen
  }
}

function componentOf(block: LessonBlockId): string {
  return LESSON_BLOCKS.find((item) => item.id === block)?.component ?? block
}
