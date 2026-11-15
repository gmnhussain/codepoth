import { cn } from "@workspace/ui/lib/utils"

import type { TocItem } from "@/components/lesson/lesson-toc"

/**
 * The TOC's links: blocks, with the author's sections nested under them.
 * Rendered by `LessonToc` (a client island), which owns the current entry.
 */
export function TocList({
  items,
  activeId,
  onNavigate,
  variant,
}: {
  readonly items: readonly TocItem[]
  readonly activeId: string | undefined
  readonly onNavigate: (id: string) => void
  readonly variant: "sidebar" | "bar"
}) {
  // The bar is the touch layout: 44px links. The sidebar is for a mouse,
  // and grows to 44px on touch screens (design.md#accessibility).
  const height =
    variant === "bar" ? "min-h-11" : "min-h-9 pointer-coarse:min-h-11"
  const link = (id: string, label: string, number?: string) => (
    <a
      href={`#${id}`}
      onClick={() => {
        onNavigate(id)
      }}
      {...(id === activeId ? { "aria-current": "location" as const } : {})}
      className={cn(
        height,
        "flex items-center gap-2 border-s-2 border-transparent py-1 ps-3 text-sm leading-snug text-muted-foreground hover:text-foreground aria-[current=location]:border-track-dot aria-[current=location]:font-semibold aria-[current=location]:text-foreground"
      )}
    >
      {number === undefined ? null : (
        <span aria-hidden="true" className="font-mono text-xs">
          {number}
        </span>
      )}
      <span>{label}</span>
    </a>
  )
  return (
    <ol className="flex flex-col">
      {items.map((item) => (
        <li key={item.id}>
          {link(item.id, item.label, item.number)}
          {item.children.length === 0 ? null : (
            <ol className="ms-4">
              {item.children.map((child) => (
                <li key={child.id}>{link(child.id, child.label)}</li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  )
}
