import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { TRACK_COLORS } from "./track-colors"

// The theme lives in packages/ui; these checks guard the tokens that
// packages/config names (docs/design.md#contrast, ADR-0008).
const css = readFileSync(
  new URL("../../ui/src/styles/globals.css", import.meta.url),
  "utf8"
)

type Tokens = Readonly<Record<string, string>>
type Rgb = readonly [number, number, number]

/** Custom properties declared in the first rule whose selector is exactly `selector`. */
function declarations(selector: string): Tokens {
  const start = css.indexOf(`\n${selector} {`)
  if (start === -1) throw new Error(`No "${selector}" rule in globals.css`)
  const end = css.indexOf("}", start)
  const tokens: Record<string, string> = {}
  for (const match of css
    .slice(start, end)
    .matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = match
    if (name !== undefined && value !== undefined) tokens[name] = value.trim()
  }
  return tokens
}

const light = declarations(":root")
const MODES = { light, dark: { ...light, ...declarations(".dark") } } as const

function resolve(tokens: Tokens, name: string): string {
  let value = tokens[name]
  for (
    let depth = 0;
    value?.startsWith("var(--") === true && depth < 10;
    depth++
  ) {
    value = tokens[value.slice("var(--".length, -1)]
  }
  if (value === undefined || !/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`--${name} does not resolve to a hex colour`)
  }
  return value
}

function rgb(hex: string): Rgb {
  return [1, 3, 5].map((index) =>
    parseInt(hex.slice(index, index + 2), 16)
  ) as unknown as Rgb
}

/** `foreground` drawn at `alpha` over `background`, as an opacity modifier renders it. */
function over(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  return foreground.map(
    (channel, index) => channel * alpha + (background[index] ?? 0) * (1 - alpha)
  ) as unknown as Rgb
}

function luminance(color: Rgb): number {
  const [r, g, b] = color.map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }) as unknown as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.x contrast ratio. */
function contrast(a: Rgb, b: Rgb): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (high + 0.05) / (low + 0.05)
}

const TEXT_MIN = 4.5
const NON_TEXT_MIN = 3
const SURFACES = ["background", "card", "muted"] as const
const MARK_SURFACES = ["background", "card"] as const

/** [token, opacity] pairs used as text on every surface. */
const TEXT_TOKENS = [
  ["foreground", 1],
  ["foreground", 0.8],
  ["muted-foreground", 1],
  ["destructive", 1],
  ["success", 1],
  ["warning", 1],
] as const

/** Hue → custom properties its `[data-track-color]` rule sets. */
function trackRule(hue: string): Tokens {
  return declarations(`[data-track-color="${hue}"]`)
}

describe("track palette", () => {
  it("has a token and a data-track-color rule for every hue, and no others", () => {
    const cssHues = [...css.matchAll(/\[data-track-color="([\w-]+)"\]/g)].map(
      (match) => match[1]
    )
    expect(cssHues).toEqual([...TRACK_COLORS])
    for (const hue of TRACK_COLORS) {
      expect(light, hue).toHaveProperty(`track-${hue}`)
      expect(trackRule(hue)).toMatchObject({ track: `var(--track-${hue})` })
    }
  })
})

describe.each(Object.entries(MODES))("contrast in %s mode", (_mode, tokens) => {
  const color = (name: string): Rgb => rgb(resolve(tokens, name))

  it.each(TEXT_TOKENS)(
    "%s at opacity %s is readable text on every surface",
    (name, alpha) => {
      for (const surface of SURFACES) {
        const background = color(surface)
        const ratio = contrast(over(color(name), background, alpha), background)
        expect(
          ratio,
          `${name}/${String(alpha)} on ${surface}`
        ).toBeGreaterThanOrEqual(TEXT_MIN)
      }
    }
  )

  it("primary-foreground is readable text on primary", () => {
    expect(
      contrast(color("primary-foreground"), color("primary"))
    ).toBeGreaterThanOrEqual(TEXT_MIN)
  })

  it("control edges (input) and the focus ring (ring/50) reach 3:1 on every surface", () => {
    for (const surface of SURFACES) {
      const background = color(surface)
      expect(
        contrast(color("input"), background),
        `input on ${surface}`
      ).toBeGreaterThanOrEqual(NON_TEXT_MIN)
      expect(
        contrast(over(color("ring"), background, 0.5), background),
        `ring/50 on ${surface}`
      ).toBeGreaterThanOrEqual(NON_TEXT_MIN)
    }
  })

  it.each(TRACK_COLORS)(
    "the %s track mark reaches 3:1 on background and card",
    (hue) => {
      const mark = trackRule(hue)["track-dot"]
      if (mark === undefined) throw new Error(`No --track-dot for ${hue}`)
      const markColor = rgb(
        resolve({ ...tokens, "track-dot": mark }, "track-dot")
      )
      for (const surface of MARK_SURFACES) {
        expect(
          contrast(markColor, color(surface)),
          `${hue} on ${surface}`
        ).toBeGreaterThanOrEqual(NON_TEXT_MIN)
      }
    }
  )
})
