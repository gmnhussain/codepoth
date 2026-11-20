"use client"

import { useMemo, useRef } from "react"
import { ChevronDownIcon } from "lucide-react"

import { flatTocIds } from "@/components/lesson/toc-ids"
import { TocList } from "@/components/lesson/toc-list"
import { useActiveId } from "@/components/lesson/use-active-id"
import { useT } from "@/lib/labels-context"

/** One TOC entry: a block, with the author's sections under it. */
export type TocItem = {
  readonly id: string
  readonly label: string
  readonly children: readonly { readonly id: string; readonly label: string }[]
}

/**
 * "এই পাঠে": the lesson's blocks with the author's sections nested under
 * them, following the reader's scroll position. `sidebar` is the right
 * column (from `xl`); `bar` is the collapsible bar above the lesson body
 * below it. No entry points into a closed <details>: headings never sit
 * inside a collapsed part (ADR-0018).
 */
export function LessonToc({
  items,
  sectionCount,
  variant,
}: {
  readonly items: readonly TocItem[]
  readonly sectionCount: number
  readonly variant: "sidebar" | "bar"
}) {
  const t = useT(["lesson"])
  const ids = useMemo(() => flatTocIds(items), [items])
  const activeId = useActiveId(ids)
  const barRef = useRef<HTMLDetailsElement>(null)
  const activeLabel =
    items
      .flatMap((item) => [item, ...item.children])
      .find((item) => item.id === activeId)?.label ?? items[0]?.label

  const onNavigate = (): void => {
    if (barRef.current !== null) barRef.current.open = false
  }

  if (variant === "bar") {
    return (
      <details ref={barRef} className="group rounded-xl border bg-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex-1 truncate">
            {t("lesson.tocCurrent", { section: activeLabel ?? "" })}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
          />
        </summary>
        <nav
          aria-label={t("lesson.inThisLesson")}
          className="border-t px-2 py-3"
        >
          <TocList
            items={items}
            activeId={activeId}
            onNavigate={onNavigate}
            variant="bar"
          />
        </nav>
      </details>
    )
  }

  return (
    <nav aria-label={t("lesson.inThisLesson")} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="font-heading text-base font-semibold">
          {t("lesson.inThisLesson")}
        </p>
        {sectionCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("lesson.sectionCount", { n: sectionCount })}
          </p>
        ) : null}
      </div>
      <TocList
        items={items}
        activeId={activeId}
        onNavigate={onNavigate}
        variant="sidebar"
      />
    </nav>
  )
}
