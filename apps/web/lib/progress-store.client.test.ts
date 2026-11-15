import { describe, expect, it, vi } from "vitest"

import { EMPTY_PROGRESS } from "@/lib/progress/empty-progress"
import { markDone, recordOpen, unmarkDone } from "@/lib/progress/operations"
import { parseStoredProgress } from "@/lib/progress/progress.schema"
import {
  PROGRESS_STORAGE_KEY,
  createProgressStore,
} from "@/lib/progress-store.client"
import type {
  ProgressStore,
  ProgressStoreHost,
} from "@/lib/progress-store.client"

const INTRO = "frontend.html.intro"
const FORMS = "frontend.html.forms"
const NOW = new Date(2026, 10, 15, 9, 0)

type StorageListener = (event: { readonly key: string | null }) => void

/** A host with an in-memory storage that can be made to fail. */
function fakeHost(initial?: string) {
  const items = new Map<string, string>()
  if (initial !== undefined) items.set(PROGRESS_STORAGE_KEY, initial)
  const storageListeners = new Set<StorageListener>()
  const state = { isReadBlocked: false, isWriteBlocked: false }
  const storage = {
    getItem: (key: string) => {
      if (state.isReadBlocked) throw new Error("SecurityError")
      return items.get(key) ?? null
    },
    setItem: (key: string, value: string) => {
      if (state.isWriteBlocked) throw new Error("QuotaExceededError")
      items.set(key, value)
    },
  }
  const host: ProgressStoreHost = {
    storage: () => storage,
    addStorageListener: (listener) => {
      storageListeners.add(listener)
    },
    removeStorageListener: (listener) => {
      storageListeners.delete(listener)
    },
    loadParser: () => Promise.resolve(parseStoredProgress),
  }
  return {
    host,
    storage,
    items,
    state,
    storageListeners,
    /** Another tab writes the value and the browser fires `storage` here. */
    writeFromOtherTab(
      value: string | null,
      key: string | null = PROGRESS_STORAGE_KEY
    ) {
      if (value === null) items.delete(PROGRESS_STORAGE_KEY)
      else items.set(PROGRESS_STORAGE_KEY, value)
      for (const listener of storageListeners) listener({ key })
    },
  }
}

/** A store whose validator has loaded: an update that changes nothing waits for it. */
async function loadedStore(host: ProgressStoreHost): Promise<ProgressStore> {
  const store = createProgressStore(host)
  await store.update((progress) => progress)
  return store
}

const stored = JSON.stringify(recordOpen(EMPTY_PROGRESS, INTRO, NOW))

/** A validator load that finishes (or fails) only when the test says so. */
function deferredParser() {
  let settle: ((isLoaded: boolean) => void) | undefined
  const loadParser = vi.fn(
    () =>
      new Promise<typeof parseStoredProgress>((resolve, reject) => {
        settle = (isLoaded) => {
          if (isLoaded) resolve(parseStoredProgress)
          else reject(new Error("ChunkLoadError"))
        }
      })
  )
  return {
    loadParser,
    finish: () => settle?.(true),
    fail: () => settle?.(false),
  }
}

describe("createProgressStore while the validator loads", () => {
  it("starts loading on the first subscriber, before any write", () => {
    const deferred = deferredParser()
    const store = createProgressStore({
      ...fakeHost().host,
      loadParser: deferred.loadParser,
    })
    expect(deferred.loadParser).not.toHaveBeenCalled()
    store.subscribe(() => undefined)
    expect(deferred.loadParser).toHaveBeenCalledTimes(1)
  })

  it("reads empty progress, the same object as the server snapshot", () => {
    const deferred = deferredParser()
    const store = createProgressStore({
      ...fakeHost(stored).host,
      loadParser: deferred.loadParser,
    })
    store.subscribe(() => undefined)
    expect(store.getSnapshot()).toBe(store.getServerSnapshot())
  })

  it("applies writes made before the load in order once it arrives", async () => {
    const deferred = deferredParser()
    const fake = fakeHost()
    const store = createProgressStore({
      ...fake.host,
      loadParser: deferred.loadParser,
    })
    store.subscribe(() => undefined)
    const opened = store.update((progress) => recordOpen(progress, INTRO, NOW))
    const done = store.update((progress) => markDone(progress, INTRO, NOW))
    const reopened = store.update((progress) => unmarkDone(progress, INTRO))
    expect(fake.items.has(PROGRESS_STORAGE_KEY)).toBe(false)
    deferred.finish()
    expect(await Promise.all([opened, done, reopened])).toEqual([
      true,
      true,
      true,
    ])
    // In order: opened, then done, then un-marked; in any other order the
    // lesson would end up done.
    expect(store.getSnapshot().lessons[INTRO]).toEqual({
      openedAt: NOW.toISOString(),
    })
  })

  it("does not lose another tab's write made during the load", async () => {
    const deferred = deferredParser()
    const fake = fakeHost()
    const store = createProgressStore({
      ...fake.host,
      loadParser: deferred.loadParser,
    })
    const listener = vi.fn()
    store.subscribe(listener)
    fake.writeFromOtherTab(stored)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
    deferred.finish()
    await vi.waitFor(() => {
      expect(Object.keys(store.getSnapshot().lessons)).toEqual([INTRO])
    })
  })

  it("keeps the page working when the load fails: empty progress, writes refused", async () => {
    const deferred = deferredParser()
    const fake = fakeHost(stored)
    const store = createProgressStore({
      ...fake.host,
      loadParser: deferred.loadParser,
    })
    store.subscribe(() => undefined)
    const write = store.update((progress) => markDone(progress, INTRO, NOW))
    deferred.fail()
    expect(await write).toBe(false)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
    expect(fake.items.get(PROGRESS_STORAGE_KEY)).toBe(stored)
  })
})

describe("createProgressStore", () => {
  it("serves empty progress until the validator loads, then the stored value", async () => {
    let resolve: (() => void) | undefined
    const fake = fakeHost(stored)
    const store = createProgressStore({
      ...fake.host,
      loadParser: () =>
        new Promise((done) => {
          resolve = () => {
            done(parseStoredProgress)
          }
        }),
    })
    const listener = vi.fn()
    store.subscribe(listener)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
    resolve?.()
    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledTimes(1)
    })
    expect(Object.keys(store.getSnapshot().lessons)).toEqual([INTRO])
  })

  it("loads the validator once, on the first subscriber", async () => {
    const fake = fakeHost()
    const loadParser = vi.fn(fake.host.loadParser)
    const store = createProgressStore({ ...fake.host, loadParser })
    expect(loadParser).not.toHaveBeenCalled()
    store.subscribe(() => undefined)
    store.subscribe(() => undefined)
    await store.update((progress) => recordOpen(progress, INTRO, NOW))
    expect(loadParser).toHaveBeenCalledTimes(1)
  })

  it("keeps empty progress when the validator cannot load, and tries again later", async () => {
    const fake = fakeHost(stored)
    const loadParser = vi
      .fn<ProgressStoreHost["loadParser"]>()
      .mockRejectedValueOnce(new Error("ChunkLoadError"))
      .mockResolvedValue(parseStoredProgress)
    const store = createProgressStore({ ...fake.host, loadParser })
    expect(
      await store.update((progress) => markDone(progress, INTRO, NOW))
    ).toBe(false)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
    expect(
      await store.update((progress) => markDone(progress, INTRO, NOW))
    ).toBe(true)
    expect(store.getSnapshot().lessons[INTRO]?.doneAt).toBe(NOW.toISOString())
  })

  it("returns the same snapshot object on every call until the data changes", async () => {
    const store = await loadedStore(fakeHost(stored).host)
    const first = store.getSnapshot()
    expect(store.getSnapshot()).toBe(first)
    expect(store.getSnapshot()).toBe(first)
    await store.update((progress) => markDone(progress, INTRO, NOW))
    const second = store.getSnapshot()
    expect(second).not.toBe(first)
    expect(store.getSnapshot()).toBe(second)
  })

  it("serves empty progress on the server", () => {
    const store = createProgressStore(fakeHost().host)
    expect(store.getServerSnapshot()).toBe(EMPTY_PROGRESS)
  })

  it("starts empty when nothing is stored", async () => {
    const store = await loadedStore(fakeHost().host)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
  })

  it.each(["{not json", "null", "[1,2]", '"text"'])(
    "starts empty when the stored value is corrupt (%s)",
    async (raw) => {
      const store = await loadedStore(fakeHost(raw).host)
      expect(store.getSnapshot()).toEqual(EMPTY_PROGRESS)
    }
  )

  it("starts empty when storage cannot be read", async () => {
    const fake = fakeHost(stored)
    fake.state.isReadBlocked = true
    const store = await loadedStore(fake.host)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
  })

  it("starts empty and saves nothing outside a browser", async () => {
    const store = await loadedStore({
      ...fakeHost().host,
      storage: () => undefined,
    })
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
    expect(
      await store.update((progress) => recordOpen(progress, INTRO, NOW))
    ).toBe(false)
  })

  it("saves an update and tells subscribers", async () => {
    const fake = fakeHost()
    const store = await loadedStore(fake.host)
    const listener = vi.fn()
    store.subscribe(listener)
    expect(
      await store.update((progress) => recordOpen(progress, INTRO, NOW))
    ).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    const saved: unknown = JSON.parse(
      fake.items.get(PROGRESS_STORAGE_KEY) ?? ""
    )
    expect(saved).toEqual(store.getSnapshot())
  })

  it("neither writes nor notifies when the operation changes nothing", async () => {
    const fake = fakeHost(JSON.stringify(markDone(EMPTY_PROGRESS, INTRO, NOW)))
    const store = await loadedStore(fake.host)
    const before = store.getSnapshot()
    const setItem = vi.spyOn(fake.storage, "setItem")
    const listener = vi.fn()
    store.subscribe(listener)
    expect(
      await store.update((progress) => markDone(progress, INTRO, NOW))
    ).toBe(true)
    expect(setItem).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
    expect(store.getSnapshot()).toBe(before)
  })

  it("keeps the current value and reports failure when saving fails", async () => {
    const fake = fakeHost()
    const store = await loadedStore(fake.host)
    const listener = vi.fn()
    store.subscribe(listener)
    fake.state.isWriteBlocked = true
    expect(
      await store.update((progress) => recordOpen(progress, INTRO, NOW))
    ).toBe(false)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
    expect(listener).not.toHaveBeenCalled()
  })

  it("follows another tab's writes and clears", async () => {
    const fake = fakeHost()
    const store = await loadedStore(fake.host)
    const listener = vi.fn()
    store.subscribe(listener)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)

    const other = recordOpen(EMPTY_PROGRESS, FORMS, NOW)
    fake.writeFromOtherTab(JSON.stringify(other))
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot()).toEqual(other)

    fake.writeFromOtherTab(null, null)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
  })

  it("ignores storage events for other keys", async () => {
    const fake = fakeHost()
    const store = await loadedStore(fake.host)
    const listener = vi.fn()
    store.subscribe(listener)
    const before = store.getSnapshot()
    for (const storageListener of fake.storageListeners) {
      storageListener({ key: "theme" })
    }
    expect(listener).not.toHaveBeenCalled()
    expect(store.getSnapshot()).toBe(before)
  })

  it("builds on the stored value, not a stale cache, so another tab's write is kept", async () => {
    const fake = fakeHost()
    const store = await loadedStore(fake.host)
    store.subscribe(() => undefined)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
    // The other tab's write lands before its storage event.
    fake.items.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify(recordOpen(EMPTY_PROGRESS, FORMS, NOW))
    )
    await store.update((progress) => markDone(progress, INTRO, NOW))
    expect(Object.keys(store.getSnapshot().lessons).sort()).toEqual([
      FORMS,
      INTRO,
    ])
  })

  it("listens for storage events only while subscribed", () => {
    const fake = fakeHost()
    const store = createProgressStore(fake.host)
    const unsubscribeA = store.subscribe(() => undefined)
    const unsubscribeB = store.subscribe(() => undefined)
    expect(fake.storageListeners.size).toBe(1)
    unsubscribeA()
    expect(fake.storageListeners.size).toBe(1)
    unsubscribeB()
    expect(fake.storageListeners.size).toBe(0)
  })

  it("reads storage again after the last subscriber leaves", async () => {
    const fake = fakeHost()
    const store = await loadedStore(fake.host)
    const unsubscribe = store.subscribe(() => undefined)
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS)
    unsubscribe()
    // Written while nobody listened: no event reached the store.
    fake.items.set(PROGRESS_STORAGE_KEY, stored)
    store.subscribe(() => undefined)
    expect(Object.keys(store.getSnapshot().lessons)).toEqual([INTRO])
  })
})
