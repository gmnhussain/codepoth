import type { ReactNode } from "react"

import { t } from "@workspace/config/t"

import { Disclosure } from "@/components/mdx/disclosure"

/**
 * One hint of an `<Exercise>`, collapsed and left out of search. The
 * exercise numbers its hints (`n`) and shows them one at a time.
 */
export function Hint({
  n = 1,
  children,
}: {
  readonly n?: number
  readonly children?: ReactNode
}) {
  return (
    <Disclosure summary={t("lesson.hint", { n })} searchable={false}>
      {children}
    </Disclosure>
  )
}
