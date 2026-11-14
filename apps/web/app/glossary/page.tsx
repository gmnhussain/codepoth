import type { Metadata } from "next"

import { t } from "@workspace/config/t"
import { getContentGraph } from "@workspace/content/content"
import {
  GLOSSARY_LETTERS,
  glossarySearchText,
  groupByLetter,
  letterOf,
  OTHER_LETTER,
} from "@workspace/content/glossary"

import { GlossaryControls } from "@/components/glossary/glossary-controls"
import { TermCard } from "@/components/glossary/term-card"
import { LabelScope } from "@/components/label-scope"
import { buildPageMetadata } from "@/lib/metadata"

const LIST_ID = "glossary-list"

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: t("nav.glossary"),
    description: t("glossary.intro"),
    path: "/glossary",
  })
}

/**
 * Every glossary term, A–Z, with its definition and the lessons that use
 * it. `<Term>` popovers in lessons link here as /glossary#<id>.
 */
export default function GlossaryPage() {
  const graph = getContentGraph()
  const groups = groupByLetter(graph.glossary)
  const countOf = (letter: string) =>
    groups.find((group) => group.letter === letter)?.terms.length ?? 0
  const letters = [
    ...GLOSSARY_LETTERS.map((letter) => ({ letter, count: countOf(letter) })),
    // "#" only appears when some term does not start with A–Z.
    ...(countOf(OTHER_LETTER) > 0
      ? [{ letter: OTHER_LETTER, count: countOf(OTHER_LETTER) }]
      : []),
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-5xl font-bold">{t("nav.glossary")}</h1>
          <p className="text-lg leading-reading text-foreground/80">
            {t("glossary.intro")}
          </p>
        </div>
        <p className="flex items-center gap-2.5 rounded-xl bg-muted px-4 py-2.5 text-sm text-foreground/80">
          <span
            lang="en"
            className="font-semibold text-foreground underline decoration-foreground/50 decoration-dotted decoration-2 underline-offset-4"
          >
            {t("glossary.underlineSample")}
          </span>
          {t("glossary.underlineHint")}
        </p>
      </header>

      {graph.glossary.length === 0 ? (
        <p className="rounded-2xl border bg-card px-6 py-12 text-center text-lg text-foreground/80">
          {t("glossary.empty")}
        </p>
      ) : (
        // The controls' labels, and the copy buttons in the cards' code
        // examples (ADR-0013).
        <LabelScope namespaces={["glossary", "copy"]}>
          <GlossaryControls
            rootId={LIST_ID}
            terms={graph.glossary.map((term) => ({
              letter: letterOf(term.term),
              search: glossarySearchText(term),
            }))}
            letters={letters}
          />
          <div id={LIST_ID} className="flex flex-col gap-10">
            {groups.map((group) => (
              <section
                key={group.letter}
                data-letter-section=""
                aria-labelledby={`letter-${group.letter}`}
                className="flex flex-col gap-4 md:flex-row md:gap-7"
              >
                <h2
                  id={`letter-${group.letter}`}
                  className="font-mono text-4xl font-medium text-muted-foreground md:w-18 md:shrink-0 md:pt-4"
                >
                  {group.letter}
                </h2>
                <div className="grid min-w-0 flex-1 gap-3.5 lg:grid-cols-2">
                  {group.terms.map((term) => (
                    <TermCard key={term.id} graph={graph} term={term} />
                  ))}
                </div>
              </section>
            ))}
          </div>
          <p className="text-center text-muted-foreground">
            {t("glossary.growing")}
          </p>
        </LabelScope>
      )}
    </div>
  )
}
