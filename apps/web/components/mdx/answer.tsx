import type { ReactNode } from "react"

import { t } from "@workspace/config/t"

import { Disclosure } from "@/components/mdx/disclosure"

/** A `<Think>` question's answer: collapsed, and left out of search. */
export function Answer({ children }: { readonly children?: ReactNode }) {
  return (
    <Disclosure summary={t("lesson.showAnswer")} searchable={false}>
      {children}
    </Disclosure>
  )
}
