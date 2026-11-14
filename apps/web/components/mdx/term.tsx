import type { ReactNode } from "react"

import { getContentGraph } from "@workspace/content/content"

import { definitionComponents } from "@/components/mdx/definition-components"
import { MdxContent } from "@/components/mdx/mdx-content"
import { TermPopover } from "@/components/mdx/term-popover"

/**
 * `<Term id="…">` in lesson MDX. Validation guarantees the id exists and,
 * for a published lesson, is published (docs/content-model.md#validation);
 * a term left out of this build (a draft term in a draft lesson) renders as
 * plain text.
 */
export function Term({
  id,
  children,
}: {
  readonly id: string
  readonly children?: ReactNode
}) {
  const term = getContentGraph().glossary.find((entry) => entry.id === id)
  if (term === undefined) return children
  return (
    <TermPopover
      term={term.term}
      termBn={term.termBn}
      href={`/glossary#${term.id}`}
      definition={
        <MdxContent code={term.mdx} components={definitionComponents} />
      }
    >
      {children}
    </TermPopover>
  )
}
