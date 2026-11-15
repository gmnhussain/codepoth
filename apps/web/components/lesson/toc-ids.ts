import type { TocItem } from "@/components/lesson/lesson-toc"

/**
 * The TOC's heading ids in reading order, blocks followed by their sections.
 * Plain module: used by the TOC island and, on the server, by the lesson page.
 */
export function flatTocIds(items: readonly TocItem[]): string[] {
  return items.flatMap((item) => [
    item.id,
    ...item.children.map((child) => child.id),
  ])
}
