/**
 * `pnpm measure:fonts <url> [path…] [--runs N]`: how web fonts load on a
 * reader's first visit to a deployed site (docs/development/performance.md#fonts).
 *
 * Each load is a fresh browser context with the cache disabled, so nothing
 * is cached, in Playwright's Chromium (no new dependency). Every page is
 * loaded `--runs` times (default 3) on each of three network profiles: no
 * throttling, and Chrome DevTools' Fast 4G and Slow 4G presets, applied
 * through the DevTools protocol. Paths default to `/ /roadmap /contents`.
 * One unthrottled load first is not counted (browser and DNS warm-up).
 *
 * Per load it records the first paint and the font files the page itself
 * requested: how many, and when the last one finished. These are read
 * before the probe draws anything, so they leave out files the probe would
 * fetch. For each `@font-face` rule on the page (one file: a family, weight
 * and subset) it reports one of:
 * - "unused": the page never requested the face's file (not drawn, so the
 *   probe does not fetch it either);
 * - for an `optional` face, "real" or "fallback": whether text in the face
 *   renders in the web font. A face that missed the first paint stays in the
 *   fallback for the whole document, so a sample in it measures the same as
 *   the fallback;
 * - for a `swap` face, "real" or "late": whether its file finished before the
 *   first paint or swapped in after it (it always ends up rendering).
 * Per family and load, the faces the page used decide: their state when they
 * all agree, "partial" otherwise, "unused" when the page used none. The
 * result is printed as performance.md's table.
 *
 * Node runs this file directly.
 */
import { parseArgs } from "node:util"

import { chromium } from "@playwright/test"
import type { Browser } from "@playwright/test"

const DEFAULT_PATHS = ["/", "/roadmap", "/contents"]
const DEFAULT_RUNS = 3
const VIEWPORT = { width: 1280, height: 800 }
const LOAD_TIMEOUT_MS = 120_000

/** Chrome DevTools' presets: latency in ms, throughput in bytes per second. */
const PROFILES = [
  { name: "No throttling", conditions: undefined },
  {
    name: "Fast 4G",
    conditions: {
      latency: 165,
      downloadThroughput: ((9000 * 1000) / 8) * 0.9,
      uploadThroughput: ((1500 * 1000) / 8) * 0.9,
    },
  },
  {
    name: "Slow 4G",
    conditions: {
      latency: 562.5,
      downloadThroughput: ((1600 * 1000) / 8) * 0.9,
      uploadThroughput: ((750 * 1000) / 8) * 0.9,
    },
  },
] as const

type FaceState = "real" | "fallback" | "late" | "unused"

type Face = {
  readonly family: string
  readonly weight: string
  readonly subset: string
  readonly state: FaceState
}

type Load = {
  readonly firstPaint: number
  readonly fontsDone: number
  readonly fontFiles: number
  readonly faces: readonly Face[]
}

const STATES = ["real", "late", "partial", "fallback", "unused"] as const
type FamilyState = (typeof STATES)[number]

/** For wrong arguments, before the browser starts. */
function fail(message: string): never {
  process.stderr.write(`measure:fonts: ${message}\n`)
  process.exit(1)
}

/**
 * Runs in the page: the first paint, the font files the page requested, and
 * each `@font-face` rule's state (see the top of this file). An `optional`
 * face the page used is drawn as sample text in its own subset, in the face
 * (fallback: serif) and in serif alone; equal widths mean the fallback.
 */
async function probePage(): Promise<Load> {
  // Sample text, not UI labels. The Bangla sample has no space: a space
  // comes from the Latin face, so one that rendered would make a Bangla face
  // that fell back measure as real.
  const BANGLA_SAMPLE = "পরিবর্তনশীল"
  const LATIN_SAMPLE = "Hamburgefonstiv 0123"
  const DIGITS_SAMPLE = "০১২৩৪৫৬৭৮৯"
  const BANGLA_CODE_POINT = 0x0995
  const LATIN_CODE_POINT = 0x0048
  // A face for the Bangla digits alone covers neither a letter nor Latin.
  const DIGIT_CODE_POINT = 0x09e7
  const SETTLE_MS = 500

  // First, before anything below can start a download: what the page loaded.
  const paint =
    performance.getEntriesByName("first-paint")[0] ??
    performance.getEntriesByName("first-contentful-paint")[0]
  const firstPaint = paint?.startTime ?? -1
  const fontEntries = performance
    .getEntriesByType("resource")
    .filter((entry) => /\.woff2(\?|$)/.test(entry.name))
    .map((entry) => entry as PerformanceResourceTiming)
  const requested = new Map(
    fontEntries.map((entry) => [entry.name, entry.responseEnd])
  )

  const covers = (unicodeRange: string, codePoint: number) =>
    unicodeRange === "" ||
    unicodeRange.split(",").some((part) => {
      const [from = "", to = from] = part.trim().replace(/^U\+/i, "").split("-")
      return (
        codePoint >= Number.parseInt(from, 16) &&
        codePoint <= Number.parseInt(to, 16)
      )
    })

  const rules: {
    family: string
    weight: string
    subset: string
    text: string
    display: string
    /** When the face's file finished, if the page requested it. */
    done: number | undefined
  }[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    const base = sheet.href ?? document.baseURI
    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const family = rule.style
        .getPropertyValue("font-family")
        .replace(/^["']|["']$/g, "")
      // next/font's metric-adjusted local fallbacks are not web fonts.
      if (family.endsWith(" Fallback")) continue
      const weight = rule.style.getPropertyValue("font-weight") || "400"
      const range = rule.style.getPropertyValue("unicode-range")
      const display = rule.style.getPropertyValue("font-display") || "auto"
      const src = rule.style.getPropertyValue("src")
      let done: number | undefined
      for (const match of src.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        const url = match[1]
        const end =
          url === undefined ? undefined : requested.get(new URL(url, base).href)
        if (end !== undefined) done = Math.max(done ?? 0, end)
      }
      const face = { family, weight, display, done }
      if (covers(range, BANGLA_CODE_POINT)) {
        rules.push({ ...face, subset: "Bangla", text: BANGLA_SAMPLE })
      } else if (covers(range, LATIN_CODE_POINT)) {
        rules.push({ ...face, subset: "Latin", text: LATIN_SAMPLE })
      } else if (covers(range, DIGIT_CODE_POINT)) {
        rules.push({ ...face, subset: "digits", text: DIGITS_SAMPLE })
      }
    }
  }

  const span = (fontFamily: string, weight: string, text: string) => {
    const element = document.createElement("span")
    element.style.cssText =
      "position:absolute;visibility:hidden;white-space:nowrap;font-size:40px;font-style:normal"
    element.style.fontFamily = fontFamily
    // A variable face lists a range ("100 900"); its first value is inside it.
    element.style.fontWeight = weight.split(" ")[0] ?? "400"
    element.textContent = text
    document.body.append(element)
    return element
  }
  // Only faces whose file the page requested are drawn, so the probe starts
  // no download of its own.
  const drawn = rules.map((rule) =>
    rule.done === undefined || rule.display === "swap"
      ? undefined
      : {
          face: span(`"${rule.family}", serif`, rule.weight, rule.text),
          fallback: span("serif", rule.weight, rule.text),
        }
  )
  await document.fonts.ready
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
  const faces = rules.map((rule, index): Face => {
    let state: FaceState
    const pair = drawn[index]
    if (rule.done === undefined) {
      state = "unused"
    } else if (pair === undefined) {
      state = rule.done <= firstPaint ? "real" : "late"
    } else {
      state =
        pair.face.getBoundingClientRect().width !==
        pair.fallback.getBoundingClientRect().width
          ? "real"
          : "fallback"
      pair.face.remove()
      pair.fallback.remove()
    }
    return {
      family: rule.family,
      weight: rule.weight,
      subset: rule.subset,
      state,
    }
  })

  const ends = fontEntries.map((entry) => entry.responseEnd)
  return {
    firstPaint: Math.round(firstPaint),
    fontsDone: Math.round(ends.length > 0 ? Math.max(...ends) : -1),
    fontFiles: ends.length,
    faces,
  }
}

async function measure(
  browser: Browser,
  url: string,
  conditions: (typeof PROFILES)[number]["conditions"]
): Promise<Load> {
  const context = await browser.newContext({ viewport: VIEWPORT })
  try {
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send("Network.enable")
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true })
    if (conditions !== undefined) {
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        ...conditions,
      })
    }
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: LOAD_TIMEOUT_MS,
    })
    if (response === null || !response.ok()) {
      throw new Error(
        `${url} answered ${String(response?.status() ?? "nothing")}`
      )
    }
    await page.waitForLoadState("networkidle", { timeout: LOAD_TIMEOUT_MS })
    return await page.evaluate(probePage)
  } finally {
    await context.close()
  }
}

/** The median; for an even count, the mean of the two middle values. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle] ?? Number.NaN
  const low = sorted[middle - 1]
  const high = sorted[middle]
  return low === undefined || high === undefined ? Number.NaN : (low + high) / 2
}

/**
 * A family's state in a load, from the faces the page used: their state
 * when they all agree, "partial" otherwise, "unused" when it used none.
 */
function familyState(load: Load, family: string): FamilyState {
  const used = new Set(
    load.faces
      .filter((face) => face.family === family && face.state !== "unused")
      .map((face) => face.state)
  )
  const [only] = used
  if (only === undefined) return "unused"
  return used.size === 1 ? only : "partial"
}

function familyCell(loads: readonly Load[], family: string): string {
  const counts = Object.fromEntries(STATES.map((state) => [state, 0])) as {
    [state in FamilyState]: number
  }
  for (const load of loads) counts[familyState(load, family)]++
  return STATES.filter((state) => counts[state] > 0)
    .map((state) => `${state} ${String(counts[state])}/${String(loads.length)}`)
    .join(", ")
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`

async function main() {
  const { values, positionals } = parseArgs({
    options: { runs: { type: "string", default: String(DEFAULT_RUNS) } },
    allowPositionals: true,
  })
  const runs = Number(values.runs)
  if (!Number.isInteger(runs) || runs < 1) fail("--runs takes a whole number")
  const [base, ...paths] = positionals
  if (base === undefined || !/^https?:\/\//.test(base)) {
    fail("name the site's URL, e.g. https://example.vercel.app")
  }
  const origin = base.replace(/\/$/, "")
  const pages = paths.length > 0 ? paths : DEFAULT_PATHS

  const browser = await chromium.launch()
  const rows: string[] = []
  const families = new Set<string>()
  const results: {
    profile: string
    page: string
    loads: Load[]
  }[] = []
  try {
    process.stdout.write(`measure:fonts: Chromium ${browser.version()}\n`)
    // Not counted: the session's first load also pays for starting the
    // browser's network stack and resolving the host.
    await measure(browser, origin + (pages[0] ?? "/"), undefined)
    for (const profile of PROFILES) {
      for (const page of pages) {
        const loads: Load[] = []
        for (let run = 0; run < runs; run++) {
          const load = await measure(browser, origin + page, profile.conditions)
          loads.push(load)
          for (const face of load.faces) families.add(face.family)
          const notReal = load.faces
            .filter(
              (face) => face.state === "fallback" || face.state === "late"
            )
            .map(
              (face) =>
                `${face.family} ${face.weight} ${face.subset} ${face.state}`
            )
          const unused = load.faces.filter((face) => face.state === "unused")
          process.stdout.write(
            `measure:fonts: ${profile.name} ${page} run ${String(run + 1)}: first paint ${String(load.firstPaint)} ms, ${String(load.fontFiles)} font files done at ${String(load.fontsDone)} ms, not real: ${notReal.join("; ") || "none"}, unused faces: ${String(unused.length)}\n`
          )
        }
        results.push({ profile: profile.name, page, loads })
      }
    }
  } finally {
    await browser.close()
  }

  const familyList = [...families].sort()
  for (const { profile, page, loads } of results) {
    rows.push(
      [
        "",
        profile,
        page,
        seconds(median(loads.map((load) => load.firstPaint))),
        seconds(median(loads.map((load) => load.fontsDone))),
        ...familyList.map((family) => familyCell(loads, family)),
        "",
      ]
        .join(" | ")
        .trim()
    )
  }
  process.stdout.write(
    [
      "",
      `${origin}, fresh context per load, cache disabled, ${String(runs)} runs per page and profile (median times):`,
      "",
      `| Profile | Page | First paint | Fonts done | ${familyList.join(" | ")} |`,
      `| ------- | ---- | ----------- | ---------- | ${familyList.map(() => "---").join(" | ")} |`,
      ...rows,
      "",
    ].join("\n")
  )
}

try {
  await main()
} catch (error) {
  // main's `finally` has closed the browser by now.
  process.stderr.write(
    `measure:fonts: ${error instanceof Error ? error.message : String(error)}\n`
  )
  process.exitCode = 1
}
