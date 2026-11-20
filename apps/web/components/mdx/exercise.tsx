import type { ReactElement, ReactNode } from "react"
import { Children, isValidElement } from "react"

import type { LabelKey } from "@workspace/config/labels"
import { t } from "@workspace/config/t"

import { Chip } from "@/components/chip"
import { Hint } from "@/components/mdx/hint"
import { Solution } from "@/components/mdx/solution"

type ElementWithChildren = ReactElement<{ readonly children?: ReactNode }>

function isElementOf(
  node: ReactNode,
  type: unknown
): node is ElementWithChildren {
  return isValidElement(node) && node.type === type
}

/** The label of each exercise level. */
const LEVEL_LABELS = {
  1: "lesson.level1",
  2: "lesson.level2",
  3: "lesson.level3",
} as const satisfies Record<1 | 2 | 3, LabelKey>

/**
 * One exercise in `<Exercises>`: title and level, the task, then the hints
 * and the solution. Hints show one at a time: a hint appears once the one
 * before it is open (CSS only). The solution sits outside that group, so a
 * reader who solved it alone can open it straight away (ADR-0018).
 */
export function Exercise({
  title,
  level,
  children,
}: {
  readonly title: string
  readonly level: 1 | 2 | 3
  readonly children?: ReactNode
}) {
  const parts = Children.toArray(children)
  const hints = parts.filter((part) => isElementOf(part, Hint))
  const solutions = parts.filter((part) => isElementOf(part, Solution))
  const task = parts.filter(
    (part) => !isElementOf(part, Hint) && !isElementOf(part, Solution)
  )
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-input bg-card p-6 leading-reading sm:px-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        <Chip data-pagefind-ignore="all">{t(LEVEL_LABELS[level])}</Chip>
      </div>
      {task}
      {hints.length === 0 ? null : (
        <div className="flex flex-col gap-2 [&>details:not([open])~details]:hidden">
          {hints.map((hint, index) => (
            <Hint key={index} n={index + 1}>
              {hint.props.children}
            </Hint>
          ))}
        </div>
      )}
      {solutions}
    </div>
  )
}
