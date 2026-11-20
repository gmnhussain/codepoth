import { compile } from "@mdx-js/mdx"
import rehypePrettyCode from "rehype-pretty-code"
import remarkGfm from "remark-gfm"

import { remarkAboutPage } from "./about"
import type { LessonBlockId } from "./block-list"
import type { BodyMeasure } from "../reading-time"
import { measureBody, withoutRanges } from "../reading-time"
import type { LessonSection } from "./blocks"
import { remarkLessonBlocks } from "./blocks"
import type { SourceSpan } from "./components"

/**
 * MDX is compiled at build time (ADR-0011): the result is a function body
 * that apps run on the server with the React runtime, so no MDX compiler or
 * highlighter reaches the browser.
 */

/**
 * Shiki theme for every code block. The code block is dark in both colour
 * modes (`--code`), so one dark theme serves both (ADR-0010); a test checks
 * every token colour against both `--code` values.
 */
export const CODE_THEME = "catppuccin-mocha"

const prettyCodeOptions = {
  theme: CODE_THEME,
  // The block background comes from the --code token, not from the theme.
  keepBackground: false,
  // Inline `code` in prose stays plain text styled by the page, not a dark chip.
  bypassInlineCode: true,
  defaultLang: { block: "plaintext", inline: "plaintext" },
}

/**
 * A compiled lesson body, the blocks it has (in order), its author sections,
 * and its words and code lines for reading time, without answers, hints and
 * solutions (ADR-0018).
 */
export type CompiledLesson = {
  readonly code: string
  readonly blocks: readonly LessonBlockId[]
  readonly sections: readonly LessonSection[]
  readonly reading: BodyMeasure
}

/** Compiles a lesson body; throws if its block structure breaks a rule. */
export async function compileLesson(
  source: string,
  { isPublished }: { readonly isPublished: boolean }
): Promise<CompiledLesson> {
  const file = await compile(source, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm, [remarkLessonBlocks, { isPublished }]],
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  })
  const sections = file.data.sections as readonly LessonSection[] | undefined
  const blocks = file.data.blocks as readonly LessonBlockId[] | undefined
  const unread = file.data.unread as readonly SourceSpan[] | undefined
  return {
    code: String(file),
    blocks: blocks ?? [],
    sections: sections ?? [],
    reading: measureBody(withoutRanges(source, unread ?? [])),
  }
}

/** Compiles a glossary definition (plain MDX, no template blocks). */
/** Compiles the about page; throws unless it has exactly one `<Privacy>` (ADR-0012). */
export async function compileAbout(source: string): Promise<string> {
  const file = await compile(source, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm, remarkAboutPage],
  })
  return String(file)
}

export async function compileGlossary(source: string): Promise<string> {
  const file = await compile(source, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  })
  return String(file)
}
