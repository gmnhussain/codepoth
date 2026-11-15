"use client"

import { useEffect, useState } from "react"

/** Distance from the top of the viewport at which a heading counts as current. */
const ACTIVE_OFFSET_PX = 120

/**
 * The id of the last heading (of `ids`, in reading order) that has scrolled
 * past the offset line: the section the reader is in. Before the effect
 * runs, the first id.
 */
export function useActiveId(ids: readonly string[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(ids[0])
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)
    const update = (): void => {
      let current = elements[0]?.id
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= ACTIVE_OFFSET_PX) {
          current = element.id
        }
      }
      setActiveId(current)
    }
    // The observer only says "something crossed"; the position check decides.
    const observer = new IntersectionObserver(update, {
      rootMargin: `-${String(ACTIVE_OFFSET_PX)}px 0px 0px 0px`,
    })
    for (const element of elements) observer.observe(element)
    update()
    return () => {
      observer.disconnect()
    }
  }, [ids])
  return activeId
}
