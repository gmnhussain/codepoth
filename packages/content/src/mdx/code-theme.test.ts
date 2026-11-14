import { readFileSync } from "node:fs"

import { bundledThemes } from "shiki"
import { describe, expect, it } from "vitest"

import { CODE_THEME } from "./compile"

// Code blocks are dark in both colour modes (ADR-0010): every colour the
// Shiki theme gives text must reach 4.5:1 on both values of --code.
const css = readFileSync(
  new URL("../../../ui/src/styles/globals.css", import.meta.url),
  "utf8"
)

/** A hex custom property declared in the `selector` rule of globals.css. */
function token(selector: string, name: string): string {
  const start = css.indexOf(`\n${selector} {`)
  const block = css.slice(start, css.indexOf("}", start))
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(block)
  if (match?.[1] === undefined) throw new Error(`No --${name} in ${selector}`)
  return match[1]
}

type Rgb = readonly [number, number, number]

/** Parses #rgb, #rrggbb or #rrggbbaa; an alpha is composited over `background`. */
function rgb(hex: string, background?: Rgb): Rgb {
  let value = hex.replace("#", "")
  if (value.length === 3) value = value.replace(/./g, (digit) => digit + digit)
  const channels = [0, 2, 4].map((index) =>
    parseInt(value.slice(index, index + 2), 16)
  )
  const alpha = value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1
  return channels.map(
    (channel, index) =>
      channel * alpha + (background?.[index] ?? 0) * (1 - alpha)
  ) as unknown as Rgb
}

function luminance(color: Rgb): number {
  const [r, g, b] = color.map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }) as unknown as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: Rgb, b: Rgb): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (high + 0.05) / (low + 0.05)
}

type ThemeJson = {
  readonly colors?: Readonly<Record<string, string>>
  readonly tokenColors?: readonly {
    readonly settings?: { readonly foreground?: string }
  }[]
}

describe(`code theme ${CODE_THEME}`, async () => {
  const loader = bundledThemes[CODE_THEME]
  const theme = (await loader()).default as ThemeJson
  const textColors = new Set<string>()
  const editorForeground = theme.colors?.["editor.foreground"]
  if (editorForeground !== undefined) textColors.add(editorForeground)
  for (const rule of theme.tokenColors ?? []) {
    const foreground = rule.settings?.foreground
    if (foreground?.startsWith("#") === true) textColors.add(foreground)
  }

  it("has text colours to check", () => {
    expect(textColors.size).toBeGreaterThan(5)
  })

  it.each([":root", ".dark"])(
    "every text colour reaches 4.5:1 on --code in %s",
    (selector) => {
      const background = rgb(token(selector, "code"))
      for (const color of textColors) {
        expect(
          contrast(rgb(color, background), background),
          color
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  )

  it.each([":root", ".dark"])(
    "--code-foreground reaches 4.5:1 on --code in %s",
    (selector) => {
      const background = rgb(token(selector, "code"))
      const foreground = rgb(token(selector, "code-foreground"))
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
    }
  )
})
