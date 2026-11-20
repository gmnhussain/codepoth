import { ExternalLinkIcon } from "lucide-react"

import { t } from "@workspace/config/t"
import { GENERATED_SECTIONS } from "@workspace/content/blocks"
import type { LessonResource } from "@workspace/content/schemas/lesson"

import { Chip } from "@/components/chip"

const HEADING_ID = `${GENERATED_SECTIONS.resources}-heading`

/**
 * "আরও পড়ো": the lesson's further-reading links after the last block
 * (ADR-0018). External links open in a new tab, which the link's name says
 * (conventions §11); an English page is marked. Other sites' titles are not
 * this lesson's words, so the section is left out of search.
 */
export function LessonResources({
  resources,
}: {
  readonly resources: readonly LessonResource[]
}) {
  return (
    <section
      id={GENERATED_SECTIONS.resources}
      aria-labelledby={HEADING_ID}
      data-pagefind-ignore="all"
      className="flex scroll-mt-24 flex-col gap-5"
    >
      <h2 id={HEADING_ID} className="text-3xl font-semibold">
        {t("lesson.resources")}
      </h2>
      <ul className="flex flex-col gap-3">
        {resources.map((resource) => (
          <li key={resource.url}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              hrefLang={resource.lang}
              className="flex min-h-11 items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                lang={resource.lang}
                className="flex-1 leading-snug underline decoration-foreground/30 underline-offset-4"
              >
                {resource.title}
              </span>
              {resource.lang === "en" ? (
                <Chip>{t("lesson.langEn")}</Chip>
              ) : null}
              <ExternalLinkIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="sr-only">{t("lesson.opensInNewTab")}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
