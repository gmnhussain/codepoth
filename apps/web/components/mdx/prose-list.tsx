import type { ComponentProps } from "react"

/**
 * The author's bulleted list in lesson prose. Exported so blocks that turn a
 * list into something else (`<Practice>`) can recognise it among children.
 */
export function ProseList(props: ComponentProps<"ul">) {
  return (
    <ul
      className="list-disc space-y-2 ps-6 text-lg leading-reading marker:text-muted-foreground"
      {...props}
    />
  )
}
