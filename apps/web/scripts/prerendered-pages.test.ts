import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  pagesFromPrerenders,
  parsePages,
  serializePages,
} from "./prerendered-pages"

const DIST = path.resolve("dist")

function fileIn(...parts: string[]): string {
  return path.join(
    DIST,
    "server",
    "route-cache",
    "APP_PAGE",
    "h",
    "$",
    ...parts
  )
}

describe("pagesFromPrerenders", () => {
  it("keeps only page routes with HTML, sorted, with files relative to the dist dir", () => {
    const pages = pagesFromPrerenders(
      [
        {
          pathname: "/learn/lang/js",
          routeType: "page",
          htmlSize: 10,
          fallback: { filePath: fileIn("learn", "lang", "js.html") },
        },
        {
          pathname: "/",
          routeType: "page",
          htmlSize: 5,
          fallback: { filePath: fileIn("index.html") },
        },
        { pathname: "/index.rsc", fallback: { filePath: fileIn("index.rsc") } },
        { pathname: "/lessons.json", routeType: "route", htmlSize: 0 },
        { pathname: "/favicon.ico", routeType: "route" },
        { pathname: "/shell", routeType: "page", htmlSize: 0 },
      ],
      DIST
    )
    expect(pages).toEqual([
      { route: "/", file: "server/route-cache/APP_PAGE/h/$/index.html" },
      {
        route: "/learn/lang/js",
        file: "server/route-cache/APP_PAGE/h/$/learn/lang/js.html",
      },
    ])
  })

  it("fails, naming the route, when a page with HTML has no file", () => {
    expect(() =>
      pagesFromPrerenders(
        [{ pathname: "/about", routeType: "page", htmlSize: 5 }],
        DIST
      )
    ).toThrow("/about")
  })
})

describe("parsePages", () => {
  it("reads back what serializePages writes", () => {
    const pages = [{ route: "/about", file: "server/x/about.html" }]
    expect(parsePages(serializePages(pages))).toEqual(pages)
  })

  it("rejects a file that is not a page list", () => {
    expect(() => parsePages("{}")).toThrow()
    expect(() => parsePages('{"pages":[{"route":"/"}]}')).toThrow()
  })
})
