# ADR-0008: Design tokens, track colours and type scale

- Status: accepted
- Date: 2026-11-14

## Context

The design defines its own palette (paper, surface, sunk, ink, ink2, ink3, line, line2, ok, bad, warn, a heatmap base), one colour per track, and around 25 font sizes (11–72px, many off Tailwind's scale such as 13, 15, 17 and 19px). The design handoff proposes replacing the shadcn `globals.css`, naming a CSS variable after each track, and setting track colours with inline styles. The repository rules say: keep the shadcn template structure, use Tailwind utilities and theme tokens only, never hard-code a list of tracks, and use 44px touch targets.

## Decision

### Palette → shadcn variables

The design palette is mapped onto the existing shadcn variables in `packages/ui/src/styles/globals.css`. The template's structure, imports and radius formula stay.

| Design  | shadcn variable                       |
| ------- | ------------------------------------- |
| paper   | `--background`                        |
| surface | `--card`, `--popover`                 |
| sunk    | `--muted`, `--secondary`, `--accent`  |
| ink     | `--foreground`, `--primary`, `--ring` |
| ink3    | `--muted-foreground`                  |
| line    | `--border`                            |
| line2   | `--input`                             |
| bad     | `--destructive`                       |

- New variables only where shadcn has no slot: `--success` (ok), `--warning` (weak quiz scores) and the track palette.
- ink2 (secondary text) uses `text-foreground/80`, as long as it passes WCAG AA on background, card and muted in light and dark mode. If any combination fails, it becomes a `--foreground-secondary` token instead (verified when the tokens are implemented).
- Heatmap levels use `bg-muted` (empty), `bg-success/35`, `bg-success/65` and `bg-success`.
- The radius stays the template's `--radius: 0.625rem`, which gives `rounded-xl` = 14px and `rounded-2xl` = 18px for cards. Pills use `rounded-full`.
- Code-block colours come from a Shiki theme, not from tokens.

### Track colours

- Colours are named by hue, not by track: red, orange, amber, indigo, green, teal, purple, magenta, blue, brown, iris, lime, ink, pink. Each hue is a `--track-<hue>` variable. Only the hues whose small-dot colour differs in light mode (amber, lime, pink) also get `--track-<hue>-dot`.
- A track's `_meta.json` stores the hue (`"color": "indigo"`). The list of hues is a tuple in `packages/config`; a test keeps it in sync with `globals.css`.
- A page or element gets its accent from a `data-track-color="<hue>"` attribute, which sets `--track` and `--track-dot`. Components use `bg-track`, `border-track`, `bg-track-dot` and opacity modifiers such as `bg-track/10`. No inline styles.
- Track colours are never used for text, because several of them fail AA contrast as text.

### Type scale

The design's sizes snap to Tailwind's default scale:

| Design (px) | Tailwind                               |
| ----------- | -------------------------------------- |
| 11–12.5     | `text-xs` (mono, digits and meta only) |
| 13–14       | `text-sm`                              |
| 15–16       | `text-base`                            |
| 17–18       | `text-lg`                              |
| 19–21       | `text-xl`                              |
| 22–26       | `text-2xl`                             |
| 28–32       | `text-3xl`                             |
| 34          | `text-4xl`                             |
| 44–52       | `text-5xl`                             |
| 56–60       | `text-6xl`                             |
| 72          | `text-7xl`                             |

- Bangla running text is at least `text-sm`.
- One `@theme` token, `--leading-reading: 1.85`, for Bangla body text and lesson prose. Tailwind's `text-*` utilities set their own line height, which is too tight for Bangla running text. Headings use `leading-snug`.
- The design's breakpoints (600, 767, 900px) map to Tailwind's `sm`, `md` and `lg`.
- Opacity tints snap to steps of 5 (`/5`, `/10`, `/30`).

### Touch targets

The generated shadcn `Button` sizes are edited, the one documented change to a generated component: `default` becomes `h-11 px-5`, `icon` becomes `size-11`, and `sm`/`icon-sm` grow to 44px on coarse pointers (`pointer-coarse:`). The edit is listed in [design.md](../design.md) and has to be kept when the component is regenerated.

## Alternatives considered

- **Replace `globals.css` with the handoff's file.** Rejected: drops the template structure and changes the radius scale every shadcn component relies on.
- **One CSS variable per track** (`--track-frontend`). Rejected: a hard-coded list of tracks in CSS; adding a track would need a CSS change.
- **Inline `style` with CSS variables.** Rejected: the no-inline-styles rule, and it scatters colour wiring across components.
- **Arbitrary sizes** (`text-[13px]`). Rejected: breaks the rule against arbitrary sizes, and 25 sizes are not a scale.
- **Leave buttons at 36px.** Rejected: design.md requires 44px touch targets.

## Consequences

- Every shadcn component picks up the design's look without being forked.
- Adding a track needs content only (a `_meta.json` with an existing hue). A new hue needs a token and a design review.
- Small visual differences from the artboards (snapped font sizes, heatmap shades) are expected and accepted.
