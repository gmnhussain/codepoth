import type { ReactElement, ReactNode } from "react"
import { Children, isValidElement } from "react"

import { t } from "@workspace/config/t"

import { BlockSection } from "@/components/mdx/block-section"
import { CopyButton } from "@/components/mdx/copy-button"
import { ProseList } from "@/components/mdx/prose-list"

type ElementWithChildren = ReactElement<{ readonly children?: ReactNode }>

function isElement(
  node: ReactNode,
  ...types: readonly unknown[]
): node is ElementWithChildren {
  return isValidElement(node) && types.includes(node.type)
}

/** Splits "**ধরন:** prompt" into the bold kind and the prompt text. */
function splitPrompt(content: ReactNode): {
  kind: ReactNode
  prompt: ReactNode
} {
  const [first, ...rest] = Children.toArray(content)
  if (!isElement(first, "strong")) return { kind: null, prompt: content }
  const label = first.props.children
  // The kind is plain bold text; anything richer is shown as written.
  const kind =
    typeof label === "string" ? label.replace(/[:：]\s*$/, "") : label
  return { kind, prompt: rest }
}

/**
 * The Practice block: AI practice prompts. Each item of the author's list becomes a row
 * with its kind, the prompt and a copy button that copies the prompt only.
 */
export function Practice({ children }: { readonly children?: ReactNode }) {
  return (
    <BlockSection block="practice">
      {Children.map(children, (child) => {
        if (!isElement(child, "ul", ProseList)) return child
        const items = Children.toArray(child.props.children).filter((item) =>
          isElement(item, "li")
        )
        return (
          <ul className="flex flex-col gap-3">
            {items.map((item, index) => {
              const { kind, prompt } = splitPrompt(item.props.children)
              return (
                <li
                  key={index}
                  data-copy-root=""
                  className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-start sm:gap-4"
                >
                  <div className="flex flex-1 flex-col gap-1.5">
                    {kind === null ? null : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {kind}
                      </span>
                    )}
                    <p data-copy-text="" className="leading-reading">
                      {prompt}
                    </p>
                  </div>
                  <CopyButton
                    label={t("copy.prompt")}
                    className="self-end sm:self-start"
                  />
                </li>
              )
            })}
          </ul>
        )
      })}
    </BlockSection>
  )
}
