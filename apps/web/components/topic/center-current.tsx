"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * A sideways-scrolling box that, on mount, centres its `[data-current]`
 * child. Sets scrollLeft directly: scrollIntoView could also scroll the page,
 * and there is no smooth scrolling, so reduced motion needs nothing.
 */
export function CenterCurrent({
  className,
  children,
}: {
  readonly className?: string
  readonly children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = ref.current
    if (box === null) return
    const current = box.querySelector("[data-current]")
    if (current === null) return
    const boxRect = box.getBoundingClientRect()
    const currentRect = current.getBoundingClientRect()
    box.scrollLeft +=
      currentRect.left +
      currentRect.width / 2 -
      (boxRect.left + boxRect.width / 2)
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
