import {
  defineCollection,
  defineConfig,
  defineSingleton,
} from "@content-collections/core"

import {
  glossaryIdOf,
  parseLessonPath,
  parseMetaPath,
  TRACKS_DIR,
} from "./src/paths"
import { glossaryDocumentSchema } from "./src/schemas/glossary-term.schema"
import { groupMetaSchema } from "./src/schemas/group-meta.schema"
import { lessonDocumentSchema } from "./src/schemas/lesson.schema"
import { mapSchema } from "./src/schemas/map.schema"
import { startRoutesSchema } from "./src/schemas/start-routes.schema"
import { topicMetaSchema } from "./src/schemas/topic-meta.schema"
import { trackMetaSchema } from "./src/schemas/track-meta.schema"

// Content Collections setup (ADR-0005). Paths are relative to this file;
// the content lives in the repository's root `content/` folder. Every file
// is validated with its Zod schema from src/schemas; an invalid file makes
// `content-collections build` (the `content:generate` task) exit with an error.
const CONTENT_DIR = "../../content"
const TRACKS = `${CONTENT_DIR}/${TRACKS_DIR}`

/** Content path of a file inside `tracks/`, as the path rules expect it. */
function tracksPath(filePath: string): string {
  return `${TRACKS_DIR}/${filePath}`
}

const tracks = defineCollection({
  name: "tracks",
  directory: TRACKS,
  include: "*/_meta.json",
  parser: "json",
  schema: trackMetaSchema,
  transform: (meta) => ({
    ...meta,
    location: parseMetaPath(tracksPath(meta._meta.filePath)),
  }),
})

const topics = defineCollection({
  name: "topics",
  directory: TRACKS,
  include: "*/*/_meta.json",
  parser: "json",
  schema: topicMetaSchema,
  transform: (meta) => ({
    ...meta,
    location: parseMetaPath(tracksPath(meta._meta.filePath)),
  }),
})

const groups = defineCollection({
  name: "groups",
  directory: TRACKS,
  include: "*/*/*/_meta.json",
  parser: "json",
  schema: groupMetaSchema,
  transform: (meta) => ({
    ...meta,
    location: parseMetaPath(tracksPath(meta._meta.filePath)),
  }),
})

const lessons = defineCollection({
  name: "lessons",
  directory: TRACKS,
  include: "**/*.mdx",
  parser: "frontmatter",
  schema: lessonDocumentSchema,
  transform: (lesson) => ({
    ...lesson,
    location: parseLessonPath(tracksPath(lesson._meta.filePath)),
  }),
})

const glossary = defineCollection({
  name: "glossary",
  directory: `${CONTENT_DIR}/glossary`,
  include: "*.mdx",
  parser: "frontmatter",
  schema: glossaryDocumentSchema,
  transform: (term) => ({ ...term, id: glossaryIdOf(term._meta.filePath) }),
})

// Optional until the content lands; the cross-file validation makes them
// required (docs/content-model.md#validation).
const map = defineSingleton({
  name: "map",
  filePath: `${CONTENT_DIR}/map.json`,
  parser: "json",
  schema: mapSchema,
  optional: true,
})

const startRoutes = defineSingleton({
  name: "startRoutes",
  filePath: `${CONTENT_DIR}/start-routes.json`,
  parser: "json",
  schema: startRoutesSchema,
  optional: true,
})

export default defineConfig({
  content: [tracks, topics, groups, lessons, glossary, map, startRoutes],
})
