import { describe, expect, it } from "vitest"

import { MAX_ROWS } from "./results"
import { searchQueryOf, searchRows } from "./search-rows.client"

/** A Pagefind stand-in: each query returns lessons with the given ids. */
function fakePagefind(byQuery: Record<string, readonly string[]>) {
  const searched: string[] = []
  const fetched: string[] = []
  const pagefind = {
    init: () => Promise.resolve(),
    search: (query: string) => {
      searched.push(query)
      return Promise.resolve({
        results: (byQuery[query] ?? []).map((id) => ({
          id,
          data: () => {
            fetched.push(id)
            return Promise.resolve({
              url: `/learn/t/p/${id}`,
              meta: { kind: "lesson", title: id },
              sub_results: [],
            })
          },
        })),
      })
    },
  }
  return { pagefind, searched, fetched }
}

describe("searchRows", () => {
  it("runs only the reader's query when no word has an ending", async () => {
    const fake = fakePagefind({ useEffect: ["a"] })
    const rows = await searchRows(fake.pagefind, "useEffect")
    expect(fake.searched).toEqual(["useEffect"])
    expect(rows.map((row) => row.title)).toEqual(["a"])
  })

  it("adds the trimmed query's results after the reader's own", async () => {
    const fake = fakePagefind({
      "ফাংশনের return": [],
      "ফাংশন return": ["closure", "use-effect"],
    })
    const rows = await searchRows(fake.pagefind, "ফাংশনের return")
    expect(fake.searched).toEqual(["ফাংশনের return", "ফাংশন return"])
    expect(rows.map((row) => row.title)).toEqual(["closure", "use-effect"])
  })

  it("keeps the reader's own matches first and lists each page once", async () => {
    const fake = fakePagefind({
      কাজের: ["literal"],
      কাজ: ["other", "literal"],
    })
    const rows = await searchRows(fake.pagefind, "কাজের")
    expect(rows.map((row) => row.title)).toEqual(["literal", "other"])
  })

  it("fetches data only for the pages that can become rows", async () => {
    const ids = Array.from({ length: MAX_ROWS + 5 }, (_, i) => String(i))
    const fake = fakePagefind({ react: ids })
    await searchRows(fake.pagefind, "react")
    expect(fake.fetched).toHaveLength(MAX_ROWS)
  })

  it("searches nothing for an empty or blank query", async () => {
    const fake = fakePagefind({})
    expect(await searchRows(fake.pagefind, "   ")).toEqual([])
    expect(fake.searched).toEqual([])
  })

  it("gives no rows when Pagefind answers in an unexpected shape", async () => {
    const pagefind = {
      init: () => Promise.resolve(),
      search: () => Promise.resolve({ results: "nope" }),
    }
    expect(await searchRows(pagefind, "react")).toEqual([])
  })
})

describe("searchQueryOf", () => {
  it("normalises like the index and trims spaces", () => {
    expect(searchQueryOf(`  ট্র${String.fromCodePoint(0x200d)}্যাকিং `)).toBe(
      "ট্র্যাকিং"
    )
  })
})
