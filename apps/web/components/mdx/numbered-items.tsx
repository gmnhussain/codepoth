import type { ReactElement, ReactNode } from "react"
import { Children, isValidElement } from "react"

type ElementWithChildren = ReactElement<{ readonly children?: ReactNode }>

function isElement(node: ReactNode, tag: string): node is ElementWithChildren {
  return isValidElement(node) && node.type === tag
}

/**
 * Replaces the author's ordered list(s) among `children` with custom items,
 * so a block can show its own numbering (Bangla digits, labels) while the
 * author writes a plain Markdown list. Other children pass through.
 */
export function withNumberedItems(
  children: ReactNode,
  renderList: (items: readonly ReactNode[]) => ReactNode
): ReactNode {
  return Children.map(children, (child) => {
    if (!isElement(child, "ol")) return child
    const items = Children.toArray(child.props.children)
      .filter((item) => isElement(item, "li"))
      .map((item) => item.props.children)
    return renderList(items)
  })
}
