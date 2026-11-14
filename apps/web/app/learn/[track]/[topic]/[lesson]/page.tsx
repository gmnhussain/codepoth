import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getContentGraph } from "@workspace/content/content"
import type { LessonRouteParams } from "@workspace/content/routes"
import { findLesson, lessonRouteParams } from "@workspace/content/routes"

import { LessonHeader } from "@/components/lesson/lesson-header"
import { LessonPager } from "@/components/lesson/lesson-pager"
import { lessonComponentsFor } from "@/components/mdx/lesson-components"
import { MdxContent } from "@/components/mdx/mdx-content"
import { buildPageMetadata } from "@/lib/metadata"

type LessonPageProps = {
  readonly params: Promise<LessonRouteParams>
}

// Every lesson is pre-rendered; any other URL is a 404 (ADR-0004).
export const dynamicParams = false

export function generateStaticParams(): LessonRouteParams[] {
  return lessonRouteParams(getContentGraph())
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const lesson = findLesson(getContentGraph(), await params)
  if (lesson === undefined) return {}
  return buildPageMetadata({
    title: lesson.title,
    // A draft may have no description yet (ADR-0009); drafts are never indexed.
    description: lesson.description ?? lesson.title,
    path: lesson.url,
  })
}

/** A lesson: header, the MDX body with its blocks, and prev/next. */
export default async function LessonPage({ params }: LessonPageProps) {
  const graph = getContentGraph()
  const lesson = findLesson(graph, await params)
  if (lesson === undefined) notFound()
  const track = graph.tracks.find((item) => item.id === lesson.track)

  return (
    <div data-track-color={track?.color}>
      <div aria-hidden="true" className="h-1.5 bg-track-dot" />
      <article className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-10 sm:px-8">
        <LessonHeader graph={graph} lesson={lesson} />
        <MdxContent
          code={lesson.mdx}
          components={lessonComponentsFor(lesson)}
        />
        <LessonPager graph={graph} lessonId={lesson.id} />
      </article>
    </div>
  )
}
