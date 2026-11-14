import {
  aboutDocument,
  allGlossaries,
  allGroups,
  allLessons,
  allTopics,
  allTracks,
  map,
  startRoutes,
  tracksOrder,
} from "../.content-collections/generated"
import { siteToday } from "@workspace/config/today"

import type { AboutFile } from "./about"
import { aboutPageFor } from "./about"
import { contentOptionsFrom } from "./env"
import type { ContentFiles } from "./files"
import type { ContentGraph } from "./graph"
import { loadContent } from "./graph"

/** Every content file as Content Collections generated it. */
export const contentFiles: ContentFiles = {
  tracksOrder,
  tracks: allTracks,
  topics: allTopics,
  groups: allGroups,
  lessons: allLessons,
  glossary: allGlossaries,
  map,
  startRoutes,
}

/**
 * The about page if this build shows it (a draft only with drafts
 * included); undefined means `/about` is a 404 and the footer hides its links.
 */
export function getAboutPage(): AboutFile | undefined {
  return aboutPageFor(aboutDocument, contentOptionsFrom(process.env))
}

let cachedGraph: ContentGraph | undefined

/**
 * The content graph for this build, built once. Throws when the content
 * breaks a cross-file rule, so the build fails; warnings (e.g. a topic with
 * no map coordinates) are reported once.
 */
export function getContentGraph(
  now: () => Date = () => new Date()
): ContentGraph {
  if (cachedGraph !== undefined) return cachedGraph
  // The build date in the site time zone, where authors date their lessons.
  const today = siteToday(now())
  const { graph, warnings } = loadContent(
    contentFiles,
    contentOptionsFrom(process.env),
    today
  )
  for (const warning of warnings) process.emitWarning(warning, "ContentWarning")
  cachedGraph = graph
  return graph
}
