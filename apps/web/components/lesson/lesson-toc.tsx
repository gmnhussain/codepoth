"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { TocList } from "@/components/lesson/toc-list"
import { useT } from "@/lib/labels-context"

/** One TOC entry: a block (numbered) or an author section under it. */
export type TocItem = {
  readonly id: string
  readonly label: string
  readonly number?: string | undefined
  readonly children: readonly { readonly id: string; readonly label: string }[]
}

/** Distance from the top of the viewport at which a heading counts as current. */
const ACTIVE_OFFSET_PX = 120

/** Ids in reading order, blocks followed by their sections. */
function flatIds(items: readonly TocItem[]): string[] {
  return items.flatMap((item) => [
    item.id,
    ...item.children.map((child) => child.id),
  ])
}

/** The id of the last heading that has scrolled past the offset line. */
function useActiveId(ids: readonly string[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(ids[0])
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)
    const update = (): void => {
      let current = elements[0]?.id
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= ACTIVE_OFFSET_PX) {
          current = element.id
        }
      }
      setActiveId(current)
    }
    // The observer only says "something crossed"; the position check decides.
    const observer = new IntersectionObserver(update, {
      rootMargin: `-${String(ACTIVE_OFFSET_PX)}px 0px 0px 0px`,
    })
    for (const element of elements) observer.observe(element)
    update()
    return () => {
      observer.disconnect()
    }
  }, [ids])
  return activeId
}

/** Opens a closed <details> (the deep dive) so the link's target is visible. */
function revealTarget(id: string): void {
  const details = document.getElementById(id)?.closest("details")
  if (details !== null && details !== undefined && !details.open) {
    details.open = true
  }
}

/**
 * "এই পাঠে": the lesson's blocks with the author's sections nested under
 * them, following the reader's scroll position. `sidebar` is the right
 * column (from `xl`); `bar` is the collapsible bar above the summary below it.
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
  const ids = useMemo(() => flatIds(items), [items])
  const activeId = useActiveId(ids)
  const barRef = useRef<HTMLDetailsElement>(null)
  const activeLabel =
    items
      .flatMap((item) => [item, ...item.children])
      .find((item) => item.id === activeId)?.label ?? items[0]?.label

  const onNavigate = (id: string): void => {
    revealTarget(id)
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
