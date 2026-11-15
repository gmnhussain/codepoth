/** Says whether the section a reader is in may be saved as `lastRead.anchor`. */
export type AnchorGate = (lessonId: string, activeId: string) => boolean

/**
 * The first section seen in a page view is where the page happened to open
 * (usually the top), not where the reader stopped, so it is never saved: a
 * quick visit must not erase the saved position (ADR-0014). Once the section
 * has changed, every later one may be saved, the first one included. A new
 * lesson starts over.
 */
export function createAnchorGate(): AnchorGate {
  let start:
    { readonly lessonId: string; readonly activeId: string } | undefined
  let hasMoved = false
  return (lessonId, activeId) => {
    if (start?.lessonId !== lessonId) {
      start = { lessonId, activeId }
      hasMoved = false
      return false
    }
    if (!hasMoved && activeId === start.activeId) return false
    hasMoved = true
    return true
  }
}
