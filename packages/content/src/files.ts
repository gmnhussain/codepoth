import type { LessonBlockId } from "./mdx/block-list"
import type { LessonSection } from "./mdx/blocks"
import type { LessonLocation, MetaLocation } from "./paths"
import type { GlossaryTerm } from "./schemas/glossary-term.schema"
import type { GroupMeta } from "./schemas/group-meta.schema"
import type { LessonFrontmatter } from "./schemas/lesson.schema"
import type { MapData } from "./schemas/map.schema"
import type { StartRoutes } from "./schemas/start-routes.schema"
import type { TopicMeta } from "./schemas/topic-meta.schema"
import type { TrackMeta } from "./schemas/track-meta.schema"
import type { TracksOrder } from "./schemas/tracks-order.schema"

/** A `_meta.json` after schema validation, with where it sits. */
export type MetaFile<TMeta> = TMeta & { readonly location: MetaLocation }

/** A lesson file after schema validation. */
export type LessonFile = LessonFrontmatter & {
  readonly content: string
  readonly location: LessonLocation
  /** Compiled MDX function body (src/mdx/compile.ts). */
  readonly mdx: string
  /** The template blocks the lesson has, in order (a draft may have none). */
  readonly blocks: readonly LessonBlockId[]
  /** Author sections (`###`) and the block each sits in. */
  readonly sections: readonly LessonSection[]
}

/** A glossary entry after schema validation; `id` is its file name. */
export type GlossaryFile = GlossaryTerm & {
  readonly id: string
  readonly content: string
  /** Compiled MDX function body of the definition. */
  readonly mdx: string
}

/**
 * Every content file, each already valid on its own. This is the shape the
 * Content Collections output has; tests build it by hand.
 */
export type ContentFiles = {
  readonly tracksOrder: TracksOrder | undefined
  readonly tracks: readonly MetaFile<TrackMeta>[]
  readonly topics: readonly MetaFile<TopicMeta>[]
  readonly groups: readonly MetaFile<GroupMeta>[]
  readonly lessons: readonly LessonFile[]
  readonly glossary: readonly GlossaryFile[]
  readonly map: MapData | undefined
  readonly startRoutes: StartRoutes | undefined
}
