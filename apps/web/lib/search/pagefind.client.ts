"use client"

import { useSyncExternalStore } from "react"

/**
 * Pagefind's browser module, written by the build next to the index
 * (ADR-0015). It is fetched only when the search dialog opens, never with
 * the page.
 */
const PAGEFIND_URL = "/pagefind/pagefind.js"

/** The part of Pagefind's browser API the search dialog uses. */
export type PagefindApi = {
  readonly init: () => Promise<void>
}

/**
 * `idle` before anything asked for it, `ready` once loaded, `unavailable`
 * when the module could not load: in `next dev` (no index) or when the
 * request fails.
 */
export type PagefindStatus = "idle" | "loading" | "ready" | "unavailable"

let status: PagefindStatus = "idle"
let api: PagefindApi | undefined
const listeners = new Set<() => void>()

function setStatus(next: PagefindStatus) {
  status = next
  for (const listener of listeners) listener()
}

function isPagefind(loaded: unknown): loaded is PagefindApi {
  return (
    typeof loaded === "object" &&
    loaded !== null &&
    typeof (loaded as { init?: unknown }).init === "function"
  )
}

async function load() {
  try {
    // Not bundled: the file exists only after a build, at a fixed URL.
    const loaded: unknown = await import(/* webpackIgnore: true */ PAGEFIND_URL)
    if (!isPagefind(loaded)) throw new Error("not a Pagefind module")
    await loaded.init()
    api = loaded
    setStatus("ready")
  } catch {
    setStatus("unavailable")
  }
}

/**
 * Starts loading Pagefind unless it is loaded or loading; after a failure,
 * the next call tries again.
 */
export function loadPagefind(): void {
  if (status === "loading" || status === "ready") return
  setStatus("loading")
  void load()
}

/** The loaded Pagefind module, once `ready`. */
export function getPagefind(): PagefindApi | undefined {
  return api
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => status
const getServerSnapshot = (): PagefindStatus => "idle"

/** Pagefind's load status, updated as it changes. */
export function usePagefindStatus(): PagefindStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
