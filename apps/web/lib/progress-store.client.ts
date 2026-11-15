"use client"

import { useSyncExternalStore } from "react"

import { EMPTY_PROGRESS } from "@/lib/progress/empty-progress"
import type { Progress } from "@/lib/progress/progress.schema"

/**
 * The reader's progress in `localStorage` (ADR-0007, ADR-0014). Components
 * read it with `useProgress()` and change it with `updateProgress(operation)`
 * using the pure operations in `lib/progress/operations.ts`.
 *
 * The validator (Zod) is loaded on first use, not with the page: until it
 * arrives the store serves empty progress, which is what the server
 * rendered anyway, and updates wait for it.
 */

export const PROGRESS_STORAGE_KEY = "codepoth:v1"

/** Turns a JSON-parsed stored value into valid progress (`parseStoredProgress`). */
export type ParseStoredProgress = (value: unknown) => Progress

/** What the store needs from the browser; a fake one in tests. */
export type ProgressStoreHost = {
  /** `localStorage`, or `undefined` outside a browser. Allowed to throw. */
  readonly storage: () =>
    Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined
  readonly addStorageListener: (
    listener: (event: { readonly key: string | null }) => void
  ) => void
  readonly removeStorageListener: (
    listener: (event: { readonly key: string | null }) => void
  ) => void
  readonly loadParser: () => Promise<ParseStoredProgress>
}

export type ProgressStore = {
  /** The first subscriber starts loading the validator. */
  readonly subscribe: (listener: () => void) => () => void
  /** The same object until the data changes (a `useSyncExternalStore` rule). */
  readonly getSnapshot: () => Progress
  readonly getServerSnapshot: () => Progress
  /**
   * Whether the first load of the validator has settled (loaded or failed),
   * so `getSnapshot` is the stored value rather than the empty placeholder.
   * Lets a page tell "nothing saved" from "not read yet".
   */
  readonly isReady: () => boolean
  /**
   * Applies an operation to the stored value and saves it, once the
   * validator has loaded. If saving fails (quota, private mode, storage
   * disabled, the validator not loading) nothing changes and the page keeps
   * working. Resolves to whether the progress is saved as asked.
   */
  readonly update: (
    operation: (progress: Progress) => Progress
  ) => Promise<boolean>
  /**
   * "সব মুছে ফেলো": removes the stored key (ADR-0007) and tells every reader
   * of the store. Returns whether storage could be changed.
   */
  readonly clear: () => boolean
}

export function createProgressStore(host: ProgressStoreHost): ProgressStore {
  const listeners = new Set<() => void>()
  let parse: ParseStoredProgress | undefined
  let loading: Promise<ParseStoredProgress> | undefined
  /** The first load has settled, either way. */
  let hasSettled = false
  /** The parsed value; `undefined` until read, and after another tab writes. */
  let cached: Progress | undefined

  function notify(): void {
    for (const listener of listeners) listener()
  }

  /** Loads the validator once; a failed load is tried again on the next call. */
  function load(): Promise<ParseStoredProgress> {
    loading ??= host.loadParser().then(
      (loaded) => {
        parse = loaded
        cached = undefined
        hasSettled = true
        notify()
        return loaded
      },
      (error: unknown) => {
        loading = undefined
        if (!hasSettled) {
          hasSettled = true
          notify()
        }
        throw error
      }
    )
    return loading
  }

  function read(parseValue: ParseStoredProgress): Progress {
    try {
      const raw = host.storage()?.getItem(PROGRESS_STORAGE_KEY)
      if (raw === undefined || raw === null) return EMPTY_PROGRESS
      return parseValue(JSON.parse(raw))
    } catch {
      // Unreadable storage or corrupt JSON: start empty (conventions §10).
      return EMPTY_PROGRESS
    }
  }

  function write(progress: Progress): boolean {
    try {
      const storage = host.storage()
      if (storage === undefined) return false
      storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
      return true
    } catch {
      return false
    }
  }

  /** Another tab wrote (or cleared) the progress: read it again on demand. */
  function onStorage(event: { readonly key: string | null }): void {
    if (event.key !== PROGRESS_STORAGE_KEY && event.key !== null) return
    cached = undefined
    notify()
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      if (listeners.size === 1) {
        host.addStorageListener(onStorage)
        // A failed load leaves empty progress; the next update tries again.
        load().catch(() => undefined)
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size > 0) return
        host.removeStorageListener(onStorage)
        // Unwatched, the cache could miss another tab's write.
        cached = undefined
      }
    },
    getSnapshot() {
      if (parse === undefined) return EMPTY_PROGRESS
      cached ??= read(parse)
      return cached
    },
    getServerSnapshot() {
      return EMPTY_PROGRESS
    },
    isReady() {
      return hasSettled
    },
    async update(operation) {
      let parseValue: ParseStoredProgress
      try {
        parseValue = await load()
      } catch {
        return false
      }
      // Start from storage, not the cache, so a write from another tab whose
      // storage event has not arrived yet is not overwritten.
      const current = read(parseValue)
      const next = operation(current)
      if (next === current) return true
      if (!write(next)) return false
      cached = next
      notify()
      return true
    },
    clear() {
      try {
        const storage = host.storage()
        if (storage === undefined) return false
        storage.removeItem(PROGRESS_STORAGE_KEY)
      } catch {
        return false
      }
      cached = EMPTY_PROGRESS
      notify()
      return true
    },
  }
}

const browserHost: ProgressStoreHost = {
  storage: () =>
    typeof window === "undefined" ? undefined : window.localStorage,
  addStorageListener: (listener) => {
    window.addEventListener("storage", listener)
  },
  removeStorageListener: (listener) => {
    window.removeEventListener("storage", listener)
  },
  // A separate chunk: Zod stays out of every page's First Load JS (ADR-0014).
  loadParser: () =>
    import("@/lib/progress/progress.schema").then(
      (schema) => schema.parseStoredProgress
    ),
}

const progressStore = createProgressStore(browserHost)

/**
 * The reader's progress as React state, after hydration. On the server and
 * during hydration it is empty progress, so the prerendered HTML is the same
 * for every reader (performance.md); the stored value follows on the client,
 * and changes from this tab or another one re-render.
 */
export function useProgress(): Progress {
  return useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot
  )
}

/**
 * Whether the reader's progress has been read (or failed to), as React
 * state: false on the server and during hydration, so the prerendered HTML
 * is the same for every reader.
 */
export function useProgressReady(): boolean {
  return useSyncExternalStore(
    progressStore.subscribe,
    progressStore.isReady,
    () => false
  )
}

/** Changes the reader's progress with a pure operation; see `ProgressStore.update`. */
export function updateProgress(
  operation: (progress: Progress) => Progress
): Promise<boolean> {
  return progressStore.update(operation)
}

/** Removes all of the reader's progress; see `ProgressStore.clear`. */
export function clearProgress(): boolean {
  return progressStore.clear()
}
