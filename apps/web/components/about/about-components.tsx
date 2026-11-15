import type { ComponentProps } from "react"

import { PrivacySection } from "@/components/about/privacy-section"
import { proseComponents } from "@/components/mdx/prose-components"

function Heading2(props: ComponentProps<"h2">) {
  return <h2 className="text-2xl font-bold" {...props} />
}

function Heading3(props: ComponentProps<"h3">) {
  return <h3 className="text-xl font-semibold" {...props} />
}

function OrderedList(props: ComponentProps<"ol">) {
  return (
    <ol
      className="list-decimal space-y-2 ps-6 text-lg leading-reading marker:text-muted-foreground"
      {...props}
    />
  )
}

/**
 * Components for `content/pages/about.mdx`: the prose elements lessons use
 * (`proseComponents`), headings and numbered lists, and the one allowed
 * component, `<Privacy>` (ADR-0012).
 */
export const aboutComponents = {
  ...proseComponents,
  h2: Heading2,
  h3: Heading3,
  ol: OrderedList,
  Privacy: PrivacySection,
}
