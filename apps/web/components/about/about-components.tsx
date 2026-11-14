import type { ComponentProps } from "react"

import { PrivacySection } from "@/components/about/privacy-section"

function Heading2(props: ComponentProps<"h2">) {
  return <h2 className="text-2xl font-bold" {...props} />
}

function Heading3(props: ComponentProps<"h3">) {
  return <h3 className="text-xl font-semibold" {...props} />
}

function Paragraph(props: ComponentProps<"p">) {
  return <p className="leading-reading text-foreground/80" {...props} />
}

function List(props: ComponentProps<"ul">) {
  return (
    <ul
      className="flex list-disc flex-col gap-2 ps-6 leading-reading text-foreground/80 marker:text-muted-foreground"
      {...props}
    />
  )
}

function OrderedList(props: ComponentProps<"ol">) {
  return (
    <ol
      className="flex list-decimal flex-col gap-2 ps-6 leading-reading text-foreground/80"
      {...props}
    />
  )
}

function Anchor(props: ComponentProps<"a">) {
  return (
    <a
      className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4 hover:decoration-foreground"
      {...props}
    />
  )
}

function InlineCode(props: ComponentProps<"code">) {
  return (
    <code
      className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-foreground"
      {...props}
    />
  )
}

/**
 * Components for `content/pages/about.mdx`: plain prose elements and the
 * one allowed component, `<Privacy>` (ADR-0012).
 */
export const aboutComponents = {
  h2: Heading2,
  h3: Heading3,
  p: Paragraph,
  ul: List,
  ol: OrderedList,
  a: Anchor,
  code: InlineCode,
  Privacy: PrivacySection,
}
