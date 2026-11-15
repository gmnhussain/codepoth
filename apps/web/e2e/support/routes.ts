import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  htmlPathOf,
  prerenderedPageRoutes,
} from "../../scripts/build-search-index.ts"

const DIST_DIR = fileURLToPath(new URL("../../.next/", import.meta.url))

function readManifest(): unknown {
  return JSON.parse(
    readFileSync(path.join(DIST_DIR, "prerender-manifest.json"), "utf8")
  )
}

/**
 * Every page route the build under test pre-rendered, sorted: the same list
 * the search index is built from (ADR-0015), so a test never keeps its own.
 */
export function builtPageRoutes(): string[] {
  const routes = prerenderedPageRoutes(readManifest())
  if (routes.length === 0) {
    throw new Error("the build under test has no pre-rendered page routes")
  }
  return routes
}

/** The pre-rendered HTML of a route in the build under test. */
export function builtHtmlOf(route: string): string {
  return readFileSync(path.join(DIST_DIR, htmlPathOf(route)), "utf8")
}

/** Next's own error routes, which the sweep visits as a missing page. */
const ERROR_ROUTES = new Set(["/_not-found", "/_global-error"])

/** Whether a route is a page a reader can open by its URL. */
export function isReaderRoute(route: string): boolean {
  return !ERROR_ROUTES.has(route)
}

/** Segments in a topic URL: /learn/[track]/[topic] (ADR-0006). */
const TOPIC_SEGMENTS = 3
/** Segments in a lesson URL: /learn/[track]/[topic]/[lesson] (ADR-0006). */
const LESSON_SEGMENTS = 4

function isLearnRoute(route: string, segments: number): boolean {
  return (
    route.startsWith("/learn/") &&
    route.split("/").filter(Boolean).length === segments
  )
}

/** Whether a route is a topic page. */
export function isTopicRoute(route: string): boolean {
  return isLearnRoute(route, TOPIC_SEGMENTS)
}

/** Whether a route is a lesson page. */
export function isLessonRoute(route: string): boolean {
  return isLearnRoute(route, LESSON_SEGMENTS)
}

function largestHtml(routes: readonly string[]): string | undefined {
  return routes
    .map((route) => ({ route, size: builtHtmlOf(route).length }))
    .sort((a, b) => b.size - a.size)[0]?.route
}

/**
 * Topics and lessons that stand in for all of them where the full matrix is
 * too slow (CI): the topic with the largest HTML, the lesson with the
 * largest HTML and the first lesson with a table (wide content at phone
 * width). Chosen from the build, never by name.
 */
export function representativeRoutes(routes: readonly string[]): string[] {
  const lessons = routes.filter(isLessonRoute)
  const withTable = lessons.find((route) =>
    builtHtmlOf(route).includes("<table")
  )
  return [
    ...new Set([
      largestHtml(routes.filter(isTopicRoute)),
      largestHtml(lessons),
      withTable,
    ]),
  ].filter((route): route is string => route !== undefined)
}
