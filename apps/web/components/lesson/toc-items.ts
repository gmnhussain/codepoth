import { formatTwoDigits } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { blockNumberOf, NEXT_SECTION_NUMBER } from "@workspace/content/blocks"
import type { GraphLesson } from "@workspace/content/graph"

import type { TocItem } from "@/components/lesson/lesson-toc"

/** Id of the prev/next section's heading (lesson-pager.tsx). */
export const PAGER_HEADING_ID = "next-heading"

/**
 * TOC entries for a lesson, built at build time: the blocks it has (a quiz
 * only if it has questions) with author sections nested under their block,
 * then prev/next when the lesson has a neighbour.
 */
export function tocItemsFor(
  lesson: GraphLesson,
  { hasPager }: { readonly hasPager: boolean }
): TocItem[] {
  const hasQuiz = (lesson.quiz?.length ?? 0) > 0
  const blocks = lesson.blocks.filter((block) => block !== "quiz" || hasQuiz)
  const items: TocItem[] = blocks.map((block) => {
    const number = blockNumberOf(block)
    return {
      id: block,
      label: t(`blocks.${block}`),
      number: number === undefined ? undefined : formatTwoDigits(number),
      children: lesson.sections
        .filter((section) => section.block === block)
        .map((section) => ({ id: section.id, label: section.title })),
    }
  })
  if (hasPager) {
    items.push({
      id: PAGER_HEADING_ID,
      label: t("blocks.next"),
      number: formatTwoDigits(NEXT_SECTION_NUMBER),
      children: [],
    })
  }
  return items
}
