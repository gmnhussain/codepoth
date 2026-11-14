/**
 * Shareable page state in the query string (conventions §10): the contents
 * search now, the glossary search and A–Z filter and the roadmap's
 * ?topic=&track= later. Browser-only; call from effects and event handlers.
 */

/** A query parameter of the current URL, or "" when it is absent. */
export function readUrlParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? ""
}

/**
 * Sets or removes query parameters in place with `history.replaceState`:
 * no history entry per keystroke, and the hash is kept. An empty or
 * undefined value removes the parameter.
 */
export function writeUrlParams(
  updates: Readonly<Record<string, string | undefined>>
): void {
  const url = new URL(window.location.href)
  for (const [name, value] of Object.entries(updates)) {
    if (value === undefined || value.trim() === "") {
      url.searchParams.delete(name)
    } else {
      url.searchParams.set(name, value)
    }
  }
  if (url.href !== window.location.href) {
    window.history.replaceState(window.history.state, "", url)
  }
}
