import type { Root } from "mdast"
import { visit } from "unist-util-visit"

/** The only component the about page may use (ADR-0012). */
export const PRIVACY_COMPONENT = "Privacy"

/**
 * Checks the about page's MDX: it uses no component but `<Privacy>`, and
 * exactly one of it, so the footer's `/about#privacy` always has a target.
 */
export function remarkAboutPage() {
  return (tree: Root) => {
    let privacy = 0
    visit(tree, (node) => {
      if (
        node.type !== "mdxJsxFlowElement" &&
        node.type !== "mdxJsxTextElement"
      ) {
        return
      }
      if (node.name !== PRIVACY_COMPONENT) {
        throw new Error(
          `about.mdx may only use <${PRIVACY_COMPONENT}>, found <${node.name ?? "fragment"}>`
        )
      }
      privacy += 1
    })
    if (privacy !== 1) {
      throw new Error(
        `about.mdx needs exactly one <${PRIVACY_COMPONENT}> section, found ${String(privacy)}`
      )
    }
  }
}
