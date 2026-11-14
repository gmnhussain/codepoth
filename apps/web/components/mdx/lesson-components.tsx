import type { ComponentProps, ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { BlockSection } from "@/components/mdx/block-section"
import { CodeCaption, CodeFigure, CodePre } from "@/components/mdx/code-figure"
import { DeepDive } from "@/components/mdx/deep-dive"
import type { MdxComponents } from "@/components/mdx/mdx-content"
import { Mistakes } from "@/components/mdx/mistakes"
import type { QuizQuestion } from "@/components/mdx/quiz"
import { QuizBlock } from "@/components/mdx/quiz-block"
import { Term } from "@/components/mdx/term"
import { Practice } from "@/components/mdx/practice"
import { ProseList } from "@/components/mdx/prose-list"
import { Steps } from "@/components/mdx/steps"
import { Summary } from "@/components/mdx/summary"

/**
 * Styles for the author's own prose inside a block. Ordered lists keep their
 * plain `ol` element so `<Steps>` and `<Mistakes>` can renumber them.
 */
const PROSE =
  "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:ps-6 [&_ol_li]:leading-reading [&_ol_li]:marker:text-muted-foreground"

type Children = { readonly children?: ReactNode }

/** Inline `code` is plain text on a muted chip; block code is handled by rehype-pretty-code. */
function Code({ className, ...props }: ComponentProps<"code">) {
  const isBlock = Object.hasOwn(props, "data-language")
  if (isBlock) return <code className={className} {...props} />
  return (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono" {...props} />
  )
}

/** Server-rendered MDX components for lesson bodies (blocks and prose). */
export const lessonServerComponents = {
  Summary,
  Concept: ({ children }: Children) => (
    <BlockSection block="concept" className={PROSE}>
      {children}
    </BlockSection>
  ),
  Example: ({ children }: Children) => (
    <BlockSection block="example" className={PROSE}>
      {children}
    </BlockSection>
  ),
  Mistakes,
  DeepDive,
  Practice,
  Steps,
  Term,
  h3: ({ className, ...props }: ComponentProps<"h3">) => (
    <h3
      className={cn("mt-4 scroll-mt-24 text-2xl font-semibold", className)}
      {...props}
    />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="text-lg leading-reading" {...props} />
  ),
  ul: ProseList,
  a: (props: ComponentProps<"a">) => (
    <a
      className="font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
      {...props}
    />
  ),
  code: Code,
  figure: CodeFigure,
  figcaption: CodeCaption,
  pre: CodePre,
  table: (props: ComponentProps<"table">) => (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-base" {...props} />
    </div>
  ),
  th: (props: ComponentProps<"th">) => (
    <th
      className="border-b bg-muted px-4 py-3 text-start font-semibold"
      {...props}
    />
  ),
  td: (props: ComponentProps<"td">) => (
    <td className="border-b px-4 py-3 align-top leading-reading" {...props} />
  ),
} satisfies MdxComponents

/** The full component map for one lesson; the quiz reads its frontmatter. */
export function lessonComponentsFor(lesson: {
  readonly quiz?: readonly QuizQuestion[] | undefined
}) {
  return {
    ...lessonServerComponents,
    Quiz: () => <QuizBlock questions={lesson.quiz} />,
  } satisfies MdxComponents
}
