import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { buildSearchIndex, hasIndexableBody } from "./build-search-index"

describe("hasIndexableBody", () => {
  it("is true only when a page marks its content", () => {
    expect(hasIndexableBody('<article data-pagefind-body="">x</article>')).toBe(
      true
    )
    expect(hasIndexableBody("<main>x</main>")).toBe(false)
  })
})

describe("buildSearchIndex", () => {
  it("fails, naming the route, when a page's HTML file cannot be read", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "search-index-"))
    try {
      await expect(
        buildSearchIndex({
          distDir: dir,
          projectDir: dir,
          pages: [{ route: "/about", file: "server/missing/about.html" }],
        })
      ).rejects.toThrow("/about: cannot read server/missing/about.html")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
