import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  hasIndexableBody,
  htmlPathOf,
  prerenderedPageRoutes,
} from "./build-search-index"

describe("prerenderedPageRoutes", () => {
  it("keeps only page routes with HTML, sorted", () => {
    const manifest = {
      routes: {
        "/learn/lang/js": { routeType: "page", htmlSize: 10 },
        "/about": { routeType: "page", htmlSize: 5 },
        "/lessons.json": { routeType: "route", htmlSize: 0 },
        "/favicon.ico": { routeType: "route" },
        "/shell": { routeType: "page", htmlSize: 0 },
      },
    }
    expect(prerenderedPageRoutes(manifest)).toEqual([
      "/about",
      "/learn/lang/js",
    ])
  })

  it("returns no routes for a manifest without routes", () => {
    expect(prerenderedPageRoutes({})).toEqual([])
    expect(prerenderedPageRoutes(null)).toEqual([])
    expect(prerenderedPageRoutes({ routes: {} })).toEqual([])
  })
})

describe("htmlPathOf", () => {
  it("maps the home route to index.html", () => {
    expect(htmlPathOf("/")).toBe(path.join("server", "app", "index.html"))
  })

  it("maps a nested route to its html file", () => {
    expect(htmlPathOf("/learn/ai/agents")).toBe(
      path.join("server", "app", "learn", "ai", "agents.html")
    )
  })
})

describe("hasIndexableBody", () => {
  it("is true only when a page marks its content", () => {
    expect(hasIndexableBody('<article data-pagefind-body="">x</article>')).toBe(
      true
    )
    expect(hasIndexableBody("<main>x</main>")).toBe(false)
  })
})
