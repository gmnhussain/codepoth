import { describe, expect, it } from "vitest"

import type { ResultPage } from "./results"
import {
  MAX_ROWS,
  MAX_TERMS,
  mergeResults,
  rowsFromPages,
  toResultPage,
} from "./results"

const lesson: ResultPage = {
  url: "/learn/frontend/react/use-effect",
  meta: {
    kind: "lesson",
    title: "useEffect ও Side Effects",
    track: "Frontend",
    topic: "React",
    hue: "indigo",
  },
  subResults: [
    { url: "/learn/frontend/react/use-effect", title: "useEffect" },
    { url: "/learn/frontend/react/use-effect#summary-heading", title: "TL;DR" },
    { url: "/learn/frontend/react/use-effect#concept-heading", title: "ধারণা" },
    {
      url: "/learn/frontend/react/use-effect#example-heading",
      title: "কোডে দেখি",
    },
  ],
}

function glossaryWith(count: number): ResultPage {
  return {
    url: "/glossary",
    meta: { kind: "glossary", title: "পরিভাষা" },
    subResults: [
      { url: "/glossary", title: "পরিভাষা" },
      ...Array.from({ length: count }, (_, index) => ({
        url: `/glossary#term-${String(index)}`,
        title: `Term ${String(index)}`,
      })),
    ],
  }
}

describe("rowsFromPages", () => {
  it("keeps a lesson as one row, however many of its sections matched", () => {
    expect(rowsFromPages([lesson])).toEqual([
      {
        key: lesson.url,
        url: lesson.url,
        title: "useEffect ও Side Effects",
        kind: "lesson",
        track: "Frontend",
        topic: "React",
        hue: "indigo",
      },
    ])
  })

  it("makes one row per matching glossary term, linking to its card", () => {
    const rows = rowsFromPages([glossaryWith(2)])
    expect(rows.map((row) => [row.kind, row.url, row.title])).toEqual([
      ["glossary", "/glossary#term-0", "Term 0"],
      ["glossary", "/glossary#term-1", "Term 1"],
    ])
  })

  it("shows at most the term limit from the glossary", () => {
    expect(rowsFromPages([glossaryWith(MAX_TERMS + 3)])).toHaveLength(MAX_TERMS)
  })

  it("keeps the glossary's terms where the glossary ranked", () => {
    const topic: ResultPage = {
      url: "/learn/frontend/react",
      meta: { kind: "topic", title: "React", track: "Frontend" },
      subResults: [],
    }
    const kinds = rowsFromPages([lesson, glossaryWith(1), topic]).map(
      (row) => row.kind
    )
    expect(kinds).toEqual(["lesson", "glossary", "topic"])
  })

  it("stops at the row limit", () => {
    const pages = Array.from({ length: MAX_ROWS + 4 }, (_, index) => ({
      ...lesson,
      url: `/learn/x/y/${String(index)}`,
    }))
    expect(rowsFromPages(pages)).toHaveLength(MAX_ROWS)
  })

  it("treats an unknown or missing kind as a page and falls back to the URL as title", () => {
    const rows = rowsFromPages([
      { url: "/about", meta: { kind: "other" }, subResults: [] },
    ])
    expect(rows).toEqual([
      { key: "/about", url: "/about", title: "/about", kind: "page" },
    ])
  })

  it("gives no rows for no pages", () => {
    expect(rowsFromPages([])).toEqual([])
  })
})

describe("toResultPage", () => {
  it("reads Pagefind's result data", () => {
    expect(
      toResultPage({
        url: "/about",
        meta: { title: "এই সাইট সম্পর্কে", kind: "page", image: 3 },
        sub_results: [
          { url: "/about#privacy-heading", title: "প্রাইভেসি", excerpt: "…" },
          { url: 1 },
        ],
      })
    ).toEqual({
      url: "/about",
      meta: { title: "এই সাইট সম্পর্কে", kind: "page" },
      subResults: [{ url: "/about#privacy-heading", title: "প্রাইভেসি" }],
    })
  })

  it("rejects data without a URL", () => {
    expect(toResultPage({ meta: {} })).toBeUndefined()
    expect(toResultPage(null)).toBeUndefined()
  })
})

describe("mergeResults", () => {
  it("keeps the reader's own results first and adds only new ones", () => {
    const own = [{ id: "a" }, { id: "b" }]
    const extra = [{ id: "b" }, { id: "c" }]
    expect(mergeResults(own, extra).map((result) => result.id)).toEqual([
      "a",
      "b",
      "c",
    ])
  })

  it("works with either list empty", () => {
    expect(mergeResults([], [{ id: "c" }])).toEqual([{ id: "c" }])
    expect(mergeResults([{ id: "a" }], [])).toEqual([{ id: "a" }])
  })
})
