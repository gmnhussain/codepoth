import type { NextAdapter } from "next"
import { describe, expect, it } from "vitest"

import { withSearchIndex } from "./with-search-index"
import type {
  BuildCompleteContext,
  SearchIndexHooks,
} from "./with-search-index"

const CTX = {} as BuildCompleteContext

function hooks(
  calls: string[],
  overrides: Partial<SearchIndexHooks> = {}
): SearchIndexHooks {
  return {
    onVercel: false,
    buildIndex: () => {
      calls.push("index")
      return Promise.resolve()
    },
    deployHasIndex: () => {
      calls.push("check")
      return Promise.resolve(true)
    },
    ...overrides,
  }
}

function innerAdapter(calls: string[]): NextAdapter {
  return {
    name: "Inner",
    modifyConfig: (config) => config,
    onBuildComplete: () => {
      calls.push("inner")
    },
  }
}

describe("withSearchIndex", () => {
  it("keeps every hook of the inner adapter, including ones it does not know", () => {
    const inner = {
      ...innerAdapter([]),
      futureHook: () => "kept",
    } as NextAdapter & { futureHook: () => string }
    const adapter = withSearchIndex(inner, hooks([])) as typeof inner
    expect(adapter.name).toBe("Inner")
    expect(adapter.modifyConfig).toBe(inner.modifyConfig)
    expect(adapter.futureHook()).toBe("kept")
  })

  it("builds the index before the inner adapter's onBuildComplete, then checks its output on Vercel", async () => {
    const calls: string[] = []
    const adapter = withSearchIndex(
      innerAdapter(calls),
      hooks(calls, { onVercel: true })
    )
    await adapter.onBuildComplete?.(CTX)
    expect(calls).toEqual(["index", "inner", "check"])
  })

  it("builds the index on its own when there is no inner adapter (local builds)", async () => {
    const calls: string[] = []
    const adapter = withSearchIndex(undefined, hooks(calls))
    await adapter.onBuildComplete?.(CTX)
    expect(calls).toEqual(["index"])
  })

  it("fails on Vercel without an inner adapter, before indexing", async () => {
    const calls: string[] = []
    const adapter = withSearchIndex(undefined, hooks(calls, { onVercel: true }))
    await expect(adapter.onBuildComplete?.(CTX)).rejects.toThrow(
      "NEXT_ADAPTER_PATH"
    )
    expect(calls).toEqual([])
  })

  it("fails on Vercel when the inner adapter's output has no index", async () => {
    const calls: string[] = []
    const adapter = withSearchIndex(
      innerAdapter(calls),
      hooks(calls, {
        onVercel: true,
        deployHasIndex: () => Promise.resolve(false),
      })
    )
    await expect(adapter.onBuildComplete?.(CTX)).rejects.toThrow(
      "did not deploy public/pagefind"
    )
  })

  it("does not run the inner adapter when indexing fails", async () => {
    const calls: string[] = []
    const adapter = withSearchIndex(
      innerAdapter(calls),
      hooks(calls, {
        buildIndex: () => Promise.reject(new Error("/about: cannot read")),
      })
    )
    await expect(adapter.onBuildComplete?.(CTX)).rejects.toThrow("/about")
    expect(calls).toEqual([])
  })
})
