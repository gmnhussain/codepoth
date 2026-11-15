import type { ComponentProps } from "react"

import { ProseList } from "@/components/mdx/prose-list"

function Paragraph(props: ComponentProps<"p">) {
  return <p className="text-lg leading-reading" {...props} />
}

function Anchor(props: ComponentProps<"a">) {
  return (
    <a
      className="font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
      {...props}
    />
  )
}

/** Inline `code` is plain text on a muted chip; block code is handled by rehype-pretty-code. */
function Code({ className, ...props }: ComponentProps<"code">) {
  const isBlock = Object.hasOwn(props, "data-language")
  if (isBlock) return <code className={className} {...props} />
  return (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono" {...props} />
  )
}

/**
 * The prose elements every page of authored text shares: paragraphs,
 * bulleted lists, links and inline code. Lesson bodies and the About page
 * spread this map and add their own elements.
 */
export const proseComponents = {
  p: Paragraph,
  ul: ProseList,
  a: Anchor,
  code: Code,
}
