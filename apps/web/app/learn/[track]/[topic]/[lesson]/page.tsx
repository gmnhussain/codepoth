import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { t } from "@workspace/config/t"
import { getContentGraph } from "@workspace/content/content"
import { neighboursOf } from "@workspace/content/graph"
import type { LessonRouteParams } from "@workspace/content/routes"
import { lessonJsonLd } from "@workspace/content/json-ld"
import { findLesson, lessonRouteParams } from "@workspace/content/routes"

import { JsonLd } from "@/components/json-ld"
import { LabelScope } from "@/components/label-scope"
import { LessonHeader } from "@/components/lesson/lesson-header"
import { LessonNav } from "@/components/lesson/lesson-nav"
import { LessonNavDrawer } from "@/components/lesson/lesson-nav-drawer"
import { LessonPager } from "@/components/lesson/lesson-pager"
import { LessonProgressCard } from "@/components/lesson/lesson-progress-card"
import { LessonProgressRecorder } from "@/components/lesson/lesson-progress-recorder"
import { LessonToc } from "@/components/lesson/lesson-toc"
import { flatTocIds } from "@/components/lesson/toc-ids"
import { tocItemsFor } from "@/components/lesson/toc-items"
import { lessonComponentsFor } from "@/components/mdx/lesson-components"
import { MdxContent } from "@/components/mdx/mdx-content"
import { SearchMetaTags } from "@/components/search/search-meta-tags"
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

/**
 * A lesson: track navigation (left from `lg`, a drawer below), header, the
 * MDX body, prev/next, and "এই পাঠে" (right from `xl`, a bar above the
 * summary below).
 */
export default async function LessonPage({ params }: LessonPageProps) {
  const graph = getContentGraph()
  const lesson = findLesson(graph, await params)
  if (lesson === undefined) notFound()
  const track = graph.tracks.find((item) => item.id === lesson.track)
  const { previous, next } = neighboursOf(graph, lesson.id)
  const tocItems = tocItemsFor(lesson, {
    hasPager: previous !== undefined || next !== undefined,
  })
  const nav = <LessonNav graph={graph} lesson={lesson} />
  const topic = graph.topicByKey.get(lesson.topicKey)
  const group =
    lesson.groupKey === undefined
      ? undefined
      : graph.groupByKey.get(lesson.groupKey)

  return (
    // Labels for the TOC, the drawer, the progress marks and toggles, copy
    // buttons, the quiz and Term popovers (ADR-0013).
    <LabelScope namespaces={["lesson", "status", "copy", "quiz", "term"]}>
      <div data-track-color={track?.color}>
        {lessonJsonLd(graph, lesson, t("nav.roadmap")).map((data) => (
          <JsonLd key={String(data["@type"])} data={data} />
        ))}
        <LessonProgressRecorder
          lessonId={lesson.id}
          sectionIds={flatTocIds(tocItems)}
        />
        <SearchMetaTags
          meta={{
            kind: "lesson",
            ...(track === undefined
              ? {}
              : { track: track.titleEn, hue: track.color }),
            ...(topic === undefined ? {} : { topic: topic.title }),
          }}
        />
        <div aria-hidden="true" className="h-1.5 bg-track-dot" />
        <div className="mx-auto flex max-w-7xl gap-10 px-4 py-10 sm:px-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-6 max-h-svh overflow-y-auto pb-10">
              {nav}
            </div>
          </aside>
          {/* The search index reads the title, description and lesson body;
              the header's other parts, the TOC and the pager are left out
              (ADR-0015). */}
          <article
            data-pagefind-body=""
            className="flex max-w-3xl min-w-0 flex-1 flex-col gap-12"
          >
            <LessonHeader
              graph={graph}
              lesson={lesson}
              navTrigger={
                <LessonNavDrawer
                  title={t("lesson.trackNav", {
                    track: track?.titleEn ?? "",
                  })}
                >
                  {nav}
                </LessonNavDrawer>
              }
            />
            {tocItems.length > 0 ? (
              <div data-pagefind-ignore="all" className="xl:hidden">
                <LessonToc
                  items={tocItems}
                  sectionCount={lesson.sections.length}
                  variant="bar"
                />
              </div>
            ) : null}
            <MdxContent
              code={lesson.mdx}
              components={lessonComponentsFor(lesson)}
            />
            <LessonPager graph={graph} lessonId={lesson.id} />
          </article>
          {tocItems.length > 0 ? (
            <aside className="hidden w-48 shrink-0 xl:block">
              <div className="sticky top-6 flex max-h-svh flex-col gap-6 overflow-y-auto pb-10">
                <LessonToc
                  items={tocItems}
                  sectionCount={lesson.sections.length}
                  variant="sidebar"
                />
                {topic === undefined ? null : (
                  <LessonProgressCard
                    topic={{ title: topic.title, lessonIds: topic.lessonIds }}
                    group={
                      group === undefined
                        ? undefined
                        : { title: group.title, lessonIds: group.lessonIds }
                    }
                  />
                )}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </LabelScope>
  )
}
