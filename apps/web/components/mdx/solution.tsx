import type { ReactNode } from "react"

import { t } from "@workspace/config/t"

import { Disclosure } from "@/components/mdx/disclosure"

/**
 * An `<Exercise>`'s solution: collapsed, left out of search, and never
 * waiting for the hints (ADR-0018).
 */
export function Solution({ children }: { readonly children?: ReactNode }) {
  return (
    <Disclosure summary={t("lesson.showSolution")} searchable={false}>
      {children}
    </Disclosure>
  )
}
