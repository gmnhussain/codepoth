import { compile } from "@mdx-js/mdx"
import rehypePrettyCode from "rehype-pretty-code"
import remarkGfm from "remark-gfm"

import type { LessonSection } from "./blocks"
import { remarkLessonBlocks } from "./blocks"

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

/** A compiled lesson body and its author sections. */
export type CompiledLesson = {
  readonly code: string
  readonly sections: readonly LessonSection[]
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
  return { code: String(file), sections: sections ?? [] }
}

/** Compiles a glossary definition (plain MDX, no template blocks). */
export async function compileGlossary(source: string): Promise<string> {
  const file = await compile(source, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  })
  return String(file)
}
