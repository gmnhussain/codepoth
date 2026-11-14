import {
  allGlossaries,
  allGroups,
  allLessons,
  allTopics,
  allTracks,
  map,
  startRoutes,
  tracksOrder,
} from "../.content-collections/generated"
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
  // The build date in UTC, the time zone of the Vercel build machines.
  const today = now().toISOString().slice(0, 10)
  const { graph, warnings } = loadContent(
    contentFiles,
    contentOptionsFrom(process.env),
    today
  )
  for (const warning of warnings) process.emitWarning(warning, "ContentWarning")
  cachedGraph = graph
  return graph
}
