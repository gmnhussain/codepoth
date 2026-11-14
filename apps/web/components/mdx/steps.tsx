import type { ReactNode } from "react"

import { t } from "@workspace/config/t"

import { withNumberedItems } from "@/components/mdx/numbered-items"

/**
 * A row of numbered steps (e.g. render → commit → effect → cleanup), written
 * as a Markdown ordered list inside `<Steps>`. Cards wrap to two columns on
 * small screens.
 */
export function Steps({ children }: { readonly children?: ReactNode }) {
  return withNumberedItems(children, (items) => (
    <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex flex-col gap-1 rounded-xl border bg-card p-4 text-sm leading-reading"
        >
          <span className="font-mono text-xs text-muted-foreground">
            {t("lesson.stepLabel", { n: index + 1 })}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  ))
}
