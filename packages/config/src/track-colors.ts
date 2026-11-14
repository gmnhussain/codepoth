/**
 * Hues a track can use in its `_meta.json` `color` field (ADR-0008).
 * Every hue has a `--track-<hue>` token and a `[data-track-color]` rule in
 * packages/ui/src/styles/globals.css; theme.test.ts keeps the two in sync.
 */
export const TRACK_COLORS = [
  "red",
  "orange",
  "amber",
  "indigo",
  "green",
  "teal",
  "purple",
  "magenta",
  "blue",
  "brown",
  "iris",
  "lime",
  "ink",
  "pink",
] as const

/** A hue from the track palette. */
export type TrackColor = (typeof TRACK_COLORS)[number]
