import Link from "next/link"

import { t } from "@workspace/config/t"
import { glossarySearchText, letterOf } from "@workspace/content/glossary"
import type { ContentGraph, GraphTerm } from "@workspace/content/graph"

import { Chip } from "@/components/chip"
import { definitionComponents } from "@/components/mdx/definition-components"
import { MdxContent } from "@/components/mdx/mdx-content"

/**
 * A glossary term: name, Bangla name, track, definition, and the lessons
 * that use it as track › topic › group › lesson links. Its id is the term's
 * id, so `/glossary#<id>` (the Term popover's link) lands on it and
 * highlights it with `:target`.
 */
export function TermCard({
  graph,
  term,
}: {
  readonly graph: ContentGraph
  readonly term: GraphTerm
}) {
  const track = graph.tracks.find((item) => item.id === term.track)
  const lessons = term.lessonIds.flatMap((id) => {
    const lesson = graph.lessonById.get(id)
    return lesson === undefined ? [] : [lesson]
  })

  return (
    <article
      id={term.id}
      aria-labelledby={`${term.id}-term`}
      data-term=""
      data-letter={letterOf(term.term)}
      data-search={glossarySearchText(term)}
      className="flex min-w-0 scroll-mt-24 flex-col gap-4 rounded-2xl border bg-card p-6 target:border-foreground target:ring-2 target:ring-foreground"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 id={`${term.id}-term`} lang="en" className="text-2xl font-bold">
            {term.term}
          </h3>
          <span className="text-sm text-muted-foreground">{term.termBn}</span>
        </div>
        {track === undefined ? null : (
          <Chip data-track-color={track.color} className="shrink-0">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-track-dot"
            />
            {track.titleEn}
          </Chip>
        )}
      </div>

      <div className="flex flex-col gap-3 leading-reading text-foreground/80">
        <MdxContent code={term.mdx} components={definitionComponents} />
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t pt-3">
        <h4 className="font-sans text-sm font-semibold text-muted-foreground">
          {t("glossary.usedIn")}
        </h4>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("glossary.usedNowhere")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {lessons.map((lesson) => {
              const lessonTrack = graph.tracks.find(
                (item) => item.id === lesson.track
              )
              const topic = graph.topicByKey.get(lesson.topicKey)
              const group =
                lesson.groupKey === undefined
                  ? undefined
                  : graph.groupByKey.get(lesson.groupKey)
              const parts = [
                lessonTrack?.titleEn,
                topic?.title,
                group?.title,
              ].filter((part): part is string => part !== undefined)
              return (
                <li key={lesson.id}>
                  <Link
                    href={lesson.url}
                    data-track-color={lessonTrack?.color}
                    className="group/lesson flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-1.5 text-sm text-foreground/80 hover:border-foreground/30 hover:text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full bg-track-dot"
                    />
                    <span className="flex min-w-0 flex-wrap items-center gap-1">
                      {parts.map((part) => (
                        <span
                          key={part}
                          className="inline-flex items-center gap-1"
                        >
                          {part}
                          {/* "›" on screen, a comma for screen readers. */}
                          <span
                            aria-hidden="true"
                            className="text-muted-foreground"
                          >
                            ›
                          </span>
                          <span className="sr-only">,</span>
                        </span>
                      ))}
                      <span className="font-semibold text-foreground group-hover/lesson:underline group-hover/lesson:underline-offset-4">
                        {lesson.title}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </article>
  )
}
