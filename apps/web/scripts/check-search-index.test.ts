import path from "node:path"

import { describe, expect, it } from "vitest"

import { missingBuildOutputs } from "./check-search-index"

const PAGES = path.join(".next", "prerendered-pages.json")
const INDEX = path.join("public", "pagefind", "pagefind.js")

function existing(...files: string[]): (file: string) => boolean {
  const set = new Set(files.map((file) => path.join("app", file)))
  return (file) => set.has(file)
}

describe("missingBuildOutputs", () => {
  it("passes when the adapter wrote the page list and the index", () => {
    expect(missingBuildOutputs("app", existing(PAGES, INDEX))).toEqual([])
  })

  it("fails when the adapter did not run, even with an index left from an earlier build", () => {
    expect(missingBuildOutputs("app", existing(INDEX))).toEqual([PAGES])
  })

  it("fails when the index is missing", () => {
    expect(missingBuildOutputs("app", existing(PAGES))).toEqual([INDEX])
  })
})
