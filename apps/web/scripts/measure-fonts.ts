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
 * Per load it records the first paint, when the last font file finished,
 * and, for each `@font-face` rule on the page (one file: a family, weight
 * and subset), whether text in that face renders in the web font ("real")
 * or in the fallback. With `display: optional` a face that missed the first
 * paint stays in the fallback for the whole document, so a sample in that
 * face measures the same as the fallback. A family counts as real in a load
 * when all of its faces are. The result is printed as performance.md's table.
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

type Face = {
  readonly family: string
  readonly weight: string
  readonly subset: string
  readonly real: boolean
}

type Load = {
  readonly firstPaint: number
  readonly fontsDone: number
  readonly fontFiles: number
  readonly faces: readonly Face[]
}

function fail(message: string): never {
  process.stderr.write(`measure:fonts: ${message}\n`)
  process.exit(1)
}

/**
 * Runs in the page: paint and font timings, and whether each `@font-face`
 * rule's face renders. Sample text in the face's own subset is measured in
 * the face (fallback: serif) and in serif alone; equal widths mean the
 * fallback. Faces the page has not used yet get the chance to load first,
 * so only faces that missed their window report the fallback.
 */
async function probePage(): Promise<Load> {
  const BANGLA_SAMPLE = "কোডপথে শেখা"
  const LATIN_SAMPLE = "Hamburgefonstiv 0123"
  const DIGITS_SAMPLE = "০১২৩৪৫৬৭৮৯"
  const BANGLA_CODE_POINT = 0x0995
  const LATIN_CODE_POINT = 0x0048
  // A face for the Bangla digits alone covers neither a letter nor Latin.
  const DIGIT_CODE_POINT = 0x09e7
  const SETTLE_MS = 500

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
  }[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const family = rule.style
        .getPropertyValue("font-family")
        .replace(/^["']|["']$/g, "")
      // next/font's metric-adjusted local fallbacks are not web fonts.
      if (family.endsWith(" Fallback")) continue
      const weight = rule.style.getPropertyValue("font-weight") || "400"
      const range = rule.style.getPropertyValue("unicode-range")
      if (covers(range, BANGLA_CODE_POINT)) {
        rules.push({ family, weight, subset: "Bangla", text: BANGLA_SAMPLE })
      } else if (covers(range, LATIN_CODE_POINT)) {
        rules.push({ family, weight, subset: "Latin", text: LATIN_SAMPLE })
      } else if (covers(range, DIGIT_CODE_POINT)) {
        rules.push({ family, weight, subset: "digits", text: DIGITS_SAMPLE })
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
  const pairs = rules.map((rule) => ({
    rule,
    face: span(`"${rule.family}", serif`, rule.weight, rule.text),
    fallback: span("serif", rule.weight, rule.text),
  }))
  await document.fonts.ready
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
  const faces = pairs.map(({ rule, face, fallback }) => {
    const real =
      face.getBoundingClientRect().width !==
      fallback.getBoundingClientRect().width
    face.remove()
    fallback.remove()
    return {
      family: rule.family,
      weight: rule.weight,
      subset: rule.subset,
      real,
    }
  })

  const paint =
    performance.getEntriesByName("first-paint")[0] ??
    performance.getEntriesByName("first-contentful-paint")[0]
  const fonts = performance
    .getEntriesByType("resource")
    .filter((entry) => /\.woff2(\?|$)/.test(entry.name))
    .map((entry) => (entry as PerformanceResourceTiming).responseEnd)
  return {
    firstPaint: Math.round(paint?.startTime ?? -1),
    fontsDone: Math.round(fonts.length > 0 ? Math.max(...fonts) : -1),
    fontFiles: fonts.length,
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
      fail(`${url} answered ${String(response?.status() ?? "nothing")}`)
    }
    await page.waitForLoadState("networkidle", { timeout: LOAD_TIMEOUT_MS })
    return await page.evaluate(probePage)
  } finally {
    await context.close()
  }
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN
}

/** A family is real in a load when every face of it rendered. */
function familyState(
  load: Load,
  family: string
): "real" | "fallback" | "partial" {
  const faces = load.faces.filter((face) => face.family === family)
  const real = faces.filter((face) => face.real).length
  if (real === faces.length) return "real"
  return real === 0 ? "fallback" : "partial"
}

function familyCell(loads: readonly Load[], family: string): string {
  const counts = { real: 0, partial: 0, fallback: 0 }
  for (const load of loads) counts[familyState(load, family)]++
  return (["real", "partial", "fallback"] as const)
    .filter((state) => counts[state] > 0)
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
          const fallbacks = load.faces
            .filter((face) => !face.real)
            .map((face) => `${face.family} ${face.weight} ${face.subset}`)
          process.stdout.write(
            `measure:fonts: ${profile.name} ${page} run ${String(run + 1)}: first paint ${String(load.firstPaint)} ms, ${String(load.fontFiles)} font files done at ${String(load.fontsDone)} ms, fallback: ${fallbacks.join("; ") || "none"}\n`
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

await main()
