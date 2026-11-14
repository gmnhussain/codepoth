"use client"

import { useSyncExternalStore } from "react"

/**
 * Shareable page state in the query string (conventions §10): the contents
 * search, the glossary search and letter, and the roadmap's topic, track,
 * search and filter. Components read a parameter with `useUrlParam` and
 * change it with `writeUrlParams`; the URL is the only copy of the state.
 */

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener("popstate", notify)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener("popstate", notify)
  }
}

/** A query parameter of the current URL, or "" when it is absent. */
export function readUrlParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? ""
}

/**
 * A query parameter as React state, kept in sync with the URL: our own
 * writes and back/forward. On the server and during hydration it is "", so
 * every visitor gets the same HTML; the real value follows on the client.
 */
export function useUrlParam(name: string): string {
  return useSyncExternalStore(
    subscribe,
    () => readUrlParam(name),
    () => ""
  )
}

/**
 * Sets or removes query parameters in place with `history.replaceState`
 * (no history entry per keystroke, the hash is kept), then tells every
 * `useUrlParam` reader. An empty or undefined value removes the parameter.
 */
export function writeUrlParams(
  updates: Readonly<Record<string, string | undefined>>
): void {
  const url = new URL(window.location.href)
  for (const [name, value] of Object.entries(updates)) {
    if (value === undefined || value === "") {
      url.searchParams.delete(name)
    } else {
      url.searchParams.set(name, value)
    }
  }
  if (url.href !== window.location.href) {
    window.history.replaceState(window.history.state, "", url)
    notify()
  }
}
