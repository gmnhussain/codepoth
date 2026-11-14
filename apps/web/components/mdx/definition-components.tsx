import type { ReactNode } from "react"

import { CodeCaption, CodeFigure, CodePre } from "@/components/mdx/code-figure"

function Paragraph(props: { readonly children?: ReactNode }) {
  return <p {...props} />
}

/**
 * Components for a glossary definition: plain paragraphs and the code
 * figure. Used by the Term popover and the glossary page.
 */
export const definitionComponents = {
  p: Paragraph,
  figure: CodeFigure,
  figcaption: CodeCaption,
  pre: CodePre,
}
