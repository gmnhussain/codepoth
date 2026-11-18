import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { formatDate } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { getAboutPage } from "@workspace/content/content"

import { aboutComponents } from "@/components/about/about-components"
import { AuthorCard } from "@/components/home/author-card"
import { MdxContent } from "@/components/mdx/mdx-content"
import { SearchMetaTags } from "@/components/search/search-meta-tags"
import { buildPageMetadata } from "@/lib/metadata"

export function generateMetadata(): Metadata {
  const page = getAboutPage()
  if (page === undefined) return {}
  return buildPageMetadata({
    title: page.title,
    description: page.description,
    path: "/about",
  })
}

/**
 * About: the author, then the page's prose from `content/pages/about.mdx`
 * with its privacy section (`#privacy`, ADR-0012). A draft page is a 404 in
 * builds without drafts.
 */
export default function AboutPage() {
  const page = getAboutPage()
  if (page === undefined) notFound()

  return (
    // The whole page is indexed for search, except the updated date
    // (ADR-0015).
    <>
      <SearchMetaTags meta={{ kind: "page" }} />
      <div
        data-pagefind-body=""
        className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-8"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold sm:text-5xl">{page.title}</h1>
          <p className="text-lg leading-reading text-foreground/80">
            {page.description}
          </p>
          <p
            data-pagefind-ignore="all"
            className="text-sm text-muted-foreground"
          >
            {t("lesson.updated", { date: formatDate(page.updated) })}
          </p>
        </header>
        <AuthorCard />
        <div className="flex flex-col gap-5">
          <MdxContent code={page.mdx} components={aboutComponents} />
        </div>
      </div>
    </>
  )
}
