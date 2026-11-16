/**
 * `pnpm lighthouse <path>… [--progress] [--runs N]`: Lighthouse on the build
 * in `.next`, by the method of the baselines in docs/development/
 * performance.md: Lighthouse 13.6.0 (run with `pnpm dlx`, not a
 * dependency), its default mobile profile, against `next start`, the
 * median of 3 runs per page, printed as performance.md's table.
 *
 * It starts `next start` on port 3419 and Chrome (Playwright's `chrome`
 * channel, the installed Google Chrome) with a remote-debugging port that
 * Lighthouse connects to, and stops both when done. With `--progress`, it
 * first reads lessons the way a reader does in that Chrome (three marked
 * done, two opened, a bookmark, a quiz answered, a last-read lesson at a
 * saved section), and Lighthouse keeps that storage
 * (`--disable-storage-reset`).
 *
 * Build first: `CONTENT_INCLUDE_DRAFTS=1 pnpm build --force` (the
 * baselines use the build with drafts). Node runs this file directly.
 */
import { spawn } from "node:child_process"
import type { ChildProcess } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

import { chromium } from "@playwright/test"
import type { BrowserContext, Page } from "@playwright/test"

import { site } from "@workspace/config/site"

const LIGHTHOUSE = "lighthouse@13.6.0"
const SERVER_PORT = 3419
const DEBUGGING_PORT = 9334
const BASE_URL = `http://localhost:${String(SERVER_PORT)}`
const DEFAULT_RUNS = 3
const SERVER_START_MS = 60_000
const POLL_MS = 250

const APP_DIR = path.resolve(import.meta.dirname, "..")
const DIST_DIR = path.join(APP_DIR, ".next")

/** Lessons marked done, opened and bookmarked for `--progress`. */
const DONE_LESSONS = 3
const OPENED_LESSONS = 2
/** The section the last-read lesson is scrolled to, and the save delay. */
const SAVED_SECTION = 3
const ANCHOR_SAVE_WAIT_MS = 2000
const WHEEL_STEP_PX = 300
const MAX_WHEEL_STEPS = 80

function fail(message: string): never {
  process.stderr.write(`lighthouse: ${message}\n`)
  process.exit(1)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Runs a command with this terminal's output; resolves to its exit code. */
function run(command: string, args: readonly string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: APP_DIR, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => {
      resolve(code ?? 1)
    })
  })
}

async function isServing(): Promise<boolean> {
  try {
    await fetch(BASE_URL)
    return true
  } catch {
    return false
  }
}

/** `next start` on its own port, never one that is already in use. */
async function startServer(): Promise<ChildProcess> {
  if (await isServing()) fail(`port ${String(SERVER_PORT)} is in use`)
  const server = spawn(
    process.execPath,
    [
      path.join("node_modules", "next", "dist", "bin", "next"),
      "start",
      "-p",
      String(SERVER_PORT),
    ],
    { cwd: APP_DIR, stdio: "ignore" }
  )
  const deadline = Date.now() + SERVER_START_MS
  while (!(await isServing())) {
    if (Date.now() > deadline) fail("next start did not answer in time")
    await wait(POLL_MS)
  }
  return server
}

/** The active label set, read as a file (as e2e/support/labels.ts does). */
async function activeLabels(): Promise<{
  readonly lesson: { readonly markDone: string; readonly bookmark: string }
}> {
  const file = new URL(
    `labels/${site.labelSet}.json`,
    import.meta.resolve("@workspace/config/site")
  )
  return JSON.parse(await readFile(fileURLToPath(file), "utf8")) as {
    readonly lesson: { readonly markDone: string; readonly bookmark: string }
  }
}

/** A lesson's pre-rendered HTML in the build. */
function builtHtml(url: string): Promise<string> {
  return readFile(path.join(DIST_DIR, "server", "app", `${url}.html`), "utf8")
}

/** In-page links of a built page: its sections, plus the skip link. */
function inPageLinks(html: string): string[] {
  return [...new Set(html.match(/href="#[^"]+"/g) ?? [])].map((href) =>
    decodeURIComponent(href.slice('href="#'.length, -1))
  )
}

/**
 * Reads lessons as a reader would, so the saved progress has the app's own
 * shape: lessons chosen from the build by rule, never by name.
 */
async function seedProgress(context: BrowserContext): Promise<string> {
  const response = await fetch(`${BASE_URL}/lessons.json`)
  const index = (await response.json()) as {
    readonly lessons: Record<string, { readonly url: string }>
  }
  const urls = Object.values(index.lessons).map((lesson) => lesson.url)
  if (urls.length < DONE_LESSONS + OPENED_LESSONS + 1) fail("too few lessons")
  const labels = await activeLabels()
  const page = await context.newPage()
  const open = async (url: string) => {
    await page.goto(`${BASE_URL}${url}`)
    await page.waitForLoadState("networkidle")
  }
  const press = (name: string) =>
    page.getByRole("button", { name, exact: true }).click()

  for (const url of urls.slice(0, DONE_LESSONS)) {
    await open(url)
    await press(labels.lesson.markDone)
  }
  await press(labels.lesson.bookmark)

  const quizUrl = await firstLessonWith(urls, 'id="quiz"')
  await open(quizUrl)
  for (const question of await page.locator("#quiz fieldset").all()) {
    await question.locator("button[aria-pressed]").first().click()
  }

  for (const url of urls.slice(DONE_LESSONS, DONE_LESSONS + OPENED_LESSONS)) {
    await open(url)
  }

  // The last-read lesson: the one with the most sections, read to a section.
  const sized = await Promise.all(
    urls.map(async (url) => ({
      url,
      sections: inPageLinks(await builtHtml(url)),
    }))
  )
  const longest = sized.sort((a, b) => b.sections.length - a.sections.length)[0]
  if (longest === undefined) fail("no lesson to read")
  await open(longest.url)
  await scrollTo(page, longest.sections)
  await wait(ANCHOR_SAVE_WAIT_MS)

  const stored = await page.evaluate(() => localStorage.getItem("codepoth:v1"))
  await page.close()
  return stored ?? ""
}

async function firstLessonWith(
  urls: readonly string[],
  marker: string
): Promise<string> {
  for (const url of urls) {
    if ((await builtHtml(url)).includes(marker)) return url
  }
  fail(`no lesson has ${marker}`)
}

/** Wheel-scrolls until a section of the lesson reaches the top. */
async function scrollTo(page: Page, ids: readonly string[]): Promise<void> {
  const visible = page.locator('nav a[href^="#"]:visible')
  const hrefs = await visible.evaluateAll((links) =>
    links.map((link) => link.getAttribute("href") ?? "")
  )
  const id = hrefs[SAVED_SECTION - 1]?.slice(1) ?? ids.at(-1)
  if (id === undefined) return
  const target = page.locator(`[id="${decodeURIComponent(id)}"]`)
  for (let step = 0; step < MAX_WHEEL_STEPS; step++) {
    const box = await target.boundingBox()
    if (box !== null && box.y < 200) return
    await page.mouse.wheel(0, WHEEL_STEP_PX)
  }
}

type Report = {
  readonly categories: Record<string, { readonly score: number | null }>
  readonly audits: Record<string, { readonly numericValue?: number }>
}

/** One Lighthouse run through `pnpm dlx`, parsed. */
async function lighthouse(
  url: string,
  outputDir: string,
  index: number,
  keepStorage: boolean
): Promise<Report> {
  const pnpm = process.env.npm_execpath
  if (pnpm === undefined || pnpm === "") fail("run this through pnpm")
  const file = path.join(outputDir, `run-${String(index)}.json`)
  const code = await run(process.execPath, [
    pnpm,
    "dlx",
    LIGHTHOUSE,
    url,
    `--port=${String(DEBUGGING_PORT)}`,
    "--output=json",
    `--output-path=${file}`,
    "--quiet",
    ...(keepStorage ? ["--disable-storage-reset"] : []),
  ])
  if (code !== 0) fail(`Lighthouse failed on ${url}`)
  return JSON.parse(await readFile(file, "utf8")) as Report
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN
}

const CATEGORIES = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["best-practices", "Best practices"],
  ["seo", "SEO"],
] as const

/** One row of performance.md's table: the median of each value. */
function row(page: string, reports: readonly Report[]): string {
  const score = (id: string) =>
    String(
      Math.round(
        median(
          reports.map((report) => (report.categories[id]?.score ?? 0) * 100)
        )
      )
    )
  const audit = (id: string) =>
    median(reports.map((report) => report.audits[id]?.numericValue ?? 0))
  const lcp = `${(audit("largest-contentful-paint") / 1000).toFixed(2)} s`
  const cls = String(Math.round(audit("cumulative-layout-shift") * 1000) / 1000)
  const tbt = `${String(Math.round(audit("total-blocking-time")))} ms`
  const [performance, ...others] = CATEGORIES.map(([id]) => score(id))
  return `| ${page} | ${performance ?? ""} | ${lcp} | ${cls} | ${tbt} | ${others.join(" | ")} |`
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      progress: { type: "boolean", default: false },
      runs: { type: "string", default: String(DEFAULT_RUNS) },
    },
    allowPositionals: true,
  })
  const runs = Number(values.runs)
  if (!Number.isInteger(runs) || runs < 1) fail("--runs takes a whole number")
  if (positionals.length === 0) fail("name at least one path, e.g. / /roadmap")

  const server = await startServer()
  const profile = await mkdtemp(path.join(tmpdir(), "codepoth-lighthouse-"))
  let context: BrowserContext | undefined
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: "chrome",
      args: [`--remote-debugging-port=${String(DEBUGGING_PORT)}`],
    })
    const version = (await (
      await fetch(`http://localhost:${String(DEBUGGING_PORT)}/json/version`)
    ).json()) as { readonly Browser?: string }
    process.stdout.write(`lighthouse: ${version.Browser ?? "Chrome"}\n`)
    if (values.progress) {
      const stored = await seedProgress(context)
      process.stdout.write(`lighthouse: saved progress ${stored}\n`)
    }
    const rows: string[] = []
    for (const page of positionals) {
      const reports: Report[] = []
      for (let index = 0; index < runs; index++) {
        process.stdout.write(`lighthouse: ${page} run ${String(index + 1)}\n`)
        reports.push(
          await lighthouse(
            `${BASE_URL}${page}`,
            profile,
            index,
            values.progress
          )
        )
      }
      rows.push(row(page, reports))
    }
    process.stdout.write(
      [
        "",
        `Lighthouse 13.6.0, default mobile profile, median of ${String(runs)} runs${values.progress ? ", with saved progress" : ""}:`,
        "",
        "| Page | Performance | LCP | CLS | TBT | Accessibility | Best practices | SEO |",
        "| ---- | ----------- | --- | --- | --- | ------------- | -------------- | --- |",
        ...rows,
        "",
      ].join("\n")
    )
  } finally {
    await context?.close()
    server.kill()
    await rm(profile, { recursive: true, force: true })
  }
}

await main()
