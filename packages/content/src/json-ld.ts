import { site } from "@workspace/config/site"

import type { ContentGraph, GraphLesson } from "./graph"
import { roadmapTrackUrl } from "./routes"

/** A JSON-LD object (schema.org). */
export type JsonLdData = Readonly<Record<string, unknown>>

// Built from code points: written literally, they would end a source line.
const LINE_SEPARATOR = String.fromCodePoint(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCodePoint(0x2029)

/**
 * JSON for an inline `<script type="application/ld+json">`. `<`, `>` and `&`
 * are written as JSON escapes, so text such as `</script>` or `<!--` in
 * content cannot end the script element or open a comment; U+2028/2029 are
 * escaped for old JavaScript parsers. The result parses back to the same
 * data.
 */
export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029")
}

function absolute(path: string): string {
  return new URL(path, site.url).href
}

/** Home's `WebSite`. */
export function websiteJsonLd(description: string): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name.bn,
    alternateName: site.name.en,
    url: absolute("/"),
    inLanguage: "bn",
    description,
  }
}

/**
 * A lesson's `LearningResource` and `BreadcrumbList` (roadmap › track ›
 * topic › lesson), the second given the roadmap crumb's name.
 */
export function lessonJsonLd(
  graph: ContentGraph,
  lesson: GraphLesson,
  roadmapName: string
): JsonLdData[] {
  const track = graph.tracks.find((item) => item.id === lesson.track)
  const topic = graph.topicByKey.get(lesson.topicKey)
  const crumbs = [
    { name: roadmapName, path: "/roadmap" },
    ...(track === undefined
      ? []
      : [{ name: track.titleEn, path: roadmapTrackUrl(track.id) }]),
    ...(topic === undefined ? [] : [{ name: topic.title, path: topic.url }]),
    { name: lesson.title, path: lesson.url },
  ]
  return [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: lesson.title,
      ...(lesson.description === undefined
        ? {}
        : { description: lesson.description }),
      url: absolute(lesson.url),
      inLanguage: "bn",
      learningResourceType: "lesson",
      isAccessibleForFree: true,
      timeRequired: `PT${String(lesson.readingMinutes)}M`,
      ...(lesson.level === undefined ? {} : { educationalLevel: lesson.level }),
      ...(lesson.published === undefined
        ? {}
        : { datePublished: lesson.published }),
      dateModified: lesson.updated,
      author: { "@type": "Person", name: site.author.name.en },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absolute(crumb.path),
      })),
    },
  ]
}
