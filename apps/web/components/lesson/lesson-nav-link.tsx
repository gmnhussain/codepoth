import Link from "next/link"

import type { GraphLesson } from "@workspace/content/graph"

import { LessonStateIcon } from "@/components/lesson/lesson-state-icon"
import { NAV_ROW_HEIGHT } from "@/components/lesson/nav-row-height"

const LESSON_LINK = `${NAV_ROW_HEIGHT} flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm leading-snug text-foreground/80 hover:bg-muted hover:text-foreground aria-[current=page]:bg-track/10 aria-[current=page]:font-semibold aria-[current=page]:text-foreground`

/**
 * A lesson in the track navigation with the reader's state mark, marked
 * when it is the current page.
 */
export function LessonNavLink({
  lesson,
  currentId,
}: {
  readonly lesson: GraphLesson
  readonly currentId: string
}) {
  return (
    <li>
      <Link
        href={lesson.url}
        className={LESSON_LINK}
        {...(lesson.id === currentId
          ? { "aria-current": "page" as const }
          : {})}
      >
        <LessonStateIcon lessonId={lesson.id} />
        <span className="min-w-0 flex-1">{lesson.title}</span>
      </Link>
    </li>
  )
}
