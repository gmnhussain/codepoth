import type { ContentOptions } from "./env"
import type { AboutPage } from "./schemas/about.schema"

/** The about page as the app renders it: frontmatter and compiled MDX. */
export type AboutFile = AboutPage & {
  /** Compiled MDX function body (src/mdx/compile.ts). */
  readonly mdx: string
}

/**
 * The about page if this build shows it: a draft only when drafts are
 * included, like lessons (ADR-0012). Undefined means `/about` is a 404 and
 * the footer leaves out its links.
 */
export function aboutPageFor(
  file: AboutFile,
  options: ContentOptions
): AboutFile | undefined {
  return file.draft && !options.includeDrafts ? undefined : file
}
