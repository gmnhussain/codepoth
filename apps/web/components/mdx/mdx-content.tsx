import type { ComponentProps } from "react"
import { run } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"

/** The component map MDX content accepts, derived from `run()`'s result. */
export type MdxComponents = NonNullable<
  ComponentProps<Awaited<ReturnType<typeof run>>["default"]>["components"]
>

/**
 * Renders MDX compiled at build time (ADR-0011). Runs only on the server
 * while pages are pre-rendered; the browser receives HTML.
 */
export async function MdxContent({
  code,
  components,
}: {
  readonly code: string
  readonly components: MdxComponents
}) {
  const { default: Content } = await run(code, {
    ...runtime,
    baseUrl: import.meta.url,
  })
  return <Content components={components} />
}
