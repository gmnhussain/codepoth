# Design

**The visual system: design reference, tokens, fonts, track colours, style and accessibility rules.**

Reference: the design handoff (pages Home, Map, Topic, Lesson, Contents, Dashboard, Glossary), kept locally in `reference/handoff/` and not committed.

Tokens are CSS variables mapped onto the shadcn theme variables in `packages/ui`.

## Fonts

Loading rules (`next/font`, subsets, `swap`): [performance.md](development/performance.md#fonts). Loaded in `apps/web/app/layout.tsx`.

| Font           | Use                    | Loaded as                     | Utility        |
| -------------- | ---------------------- | ----------------------------- | -------------- |
| Anek Bangla    | headings (`h1`–`h4`)   | variable font, one file       | `font-heading` |
| Hind Siliguri  | body, UI               | static, weights 400, 500, 600 | `font-sans`    |
| JetBrains Mono | code, numbers in chips | variable font, Latin only     | `font-mono`    |

- next/font exposes `--font-display`, `--font-body` and `--font-code`; `globals.css` maps them to `font-heading`, `font-sans` and `font-mono`. The names differ from the Tailwind theme variables so no variable refers to itself.
- JetBrains Mono has no Bangla glyphs, so `font-mono` falls back to Hind Siliguri for Bangla text in code (comments, strings).
- Anek Bangla and Hind Siliguri are preloaded (Bangla + Latin subsets, about 340 KB across 8 files measured on the first build); JetBrains Mono is not. Re-measure with Lighthouse when the pages exist.
- Heading weights in use: 500–700. Body line height: `leading-reading` (1.85, see [Type scale](#type-scale)).

## Colors

Tokens live in `packages/ui/src/styles/globals.css`, mapped onto the shadcn variables so every shadcn component picks them up ([ADR-0008](decisions/ADR-0008-design-tokens.md)). Components use Tailwind utilities on these tokens only, never hex values.

| Design name | Token (utility)                                            | Light     | Dark      |
| ----------- | ---------------------------------------------------------- | --------- | --------- |
| paper       | `background`                                               | `#FAF8F3` | `#131210` |
| surface     | `card`, `popover`                                          | `#FFFFFF` | `#1B1A17` |
| sunk        | `muted`, `secondary`, `accent`                             | `#F1EDE3` | `#24221E` |
| ink         | `foreground`, `primary`, `ring`                            | `#1C1A17` | `#F2EEE6` |
| ink2        | `foreground/80` (opacity modifier, no token)               | —         | —         |
| ink3        | `muted-foreground`                                         | `#69645A` | `#A49E91` |
| line        | `border`                                                   | `#E7E1D4` | `#2C2A25` |
| line2       | `foreground/20` for decorative edges (dashed cards, chips) | —         | —         |
| —           | `input` (control edges, 3:1)                               | `#8C877B` | `#6F6D68` |
| ok          | `success`                                                  | `#1E7A4C` | `#5BD08F` |
| bad         | `destructive`                                              | `#B4322C` | `#FF8A80` |
| warn        | `warning`                                                  | `#9A5B00` | `#FFC46B` |

- The heatmap uses `bg-muted` (no activity), `bg-success/35`, `bg-success/65` and `bg-success`.
- The shadcn `chart-*` and `sidebar-*` slots are kept and point at the same palette.
- Code-block colours come from the Shiki theme, not from tokens.
- Differences from the design: `input` is darker than line2 so control edges reach 3:1. The heatmap uses `success` instead of the backend green.

## Track colors

A track's `_meta.json` names a hue (`"color": "indigo"`); the hue list is `TRACK_COLORS` in `packages/config`. An element gets its accent from `data-track-color="<hue>"`, which sets `--track` and `--track-dot` for it and its children.

- `track-dot` (`bg-track-dot`, `border-track-dot`, `stroke-track-dot`): every mark that carries meaning, such as dots, map lines, progress fills, rings and the lesson colour bar. It reaches 3:1 on background and card in both modes.
- `track` (`bg-track/5`, `bg-track/10`, `border-track/30`): low-opacity tints only. In light mode several hues are below 3:1, so they are never used as a solid mark.
- Track colours are never used for text.

| Track         | Hue     | `track`   | `track-dot`, light mode      |
| ------------- | ------- | --------- | ---------------------------- |
| cs            | red     | `#E5484D` |                              |
| lang          | orange  | `#F76B15` | `#EC6614`                    |
| tools         | amber   | `#FFB224` | `#BF8200` (design `#D99400`) |
| frontend      | indigo  | `#3E63DD` |                              |
| backend       | green   | `#30A46C` | `#2FA26A`                    |
| database      | teal    | `#12A594` | `#11A090`                    |
| security      | purple  | `#8E4EC6` |                              |
| testing       | magenta | `#D6409F` |                              |
| devops        | blue    | `#0090FF` |                              |
| system-design | brown   | `#A18072` |                              |
| ai            | iris    | `#5B5BD6` |                              |
| mobile        | lime    | `#8CC63F` | `#699D22` (design `#6A9F22`) |
| practices     | ink     | ink       |                              |
| soft-skills   | pink    | `#FF8DCC` | `#E063A8`                    |

In dark mode `track-dot` equals `track` for every hue. The track-to-hue column is content (`_meta.json`), shown here for reference.

## Type scale

Sizes, radii and breakpoints use Tailwind's defaults; the design's pixel values snap to the nearest step.

| Design (px) | Utility                                |
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
- `leading-reading` (`--leading-reading: 1.85`, the only added `@theme` token) is the body default and is used on lesson prose. Tailwind's `text-*` utilities set their own line height, so text that sets a size and runs over several lines adds `leading-reading`. Headings use `leading-snug`.
- Radius: the template's `--radius: 0.625rem`, giving `rounded-xl` = 14px and `rounded-2xl` = 18px for cards; pills are `rounded-full`.
- Breakpoints: the design's 600 / 767 / 900px map to `sm` / `md` / `lg`.
- Opacity tints use steps of 5 (`/5`, `/10`, `/30`).

## Contrast

WCAG 2.2 AA, computed from the values in `globals.css`: text needs 4.5:1, while marks, control edges and focus indicators need 3:1 (SC 1.4.11). `packages/config/src/theme.test.ts` checks the same pairs from `globals.css`, so a colour change that breaks AA fails `pnpm test`.

| Check      | Mode  | Token                         | background | card  | muted |
| ---------- | ----- | ----------------------------- | ---------- | ----- | ----- |
| text 4.5   | light | foreground                    | 16.36      | 17.36 | 14.85 |
| text 4.5   | light | foreground/80                 | 8.81       | 9.15  | 8.28  |
| text 4.5   | light | muted-foreground              | 5.54       | 5.88  | 5.03  |
| text 4.5   | light | destructive                   | 5.76       | 6.12  | 5.23  |
| text 4.5   | light | success                       | 5.02       | 5.33  | 4.56  |
| text 4.5   | light | warning                       | 5.11       | 5.43  | 4.64  |
| text 4.5   | light | primary-foreground on primary | 16.36      | —     | —     |
| non-text 3 | light | input (control edge)          | 3.37       | 3.58  | 3.06  |
| non-text 3 | light | ring/50 (focus)               | 3.29       | 3.34  | 3.21  |
| mark 3     | light | red                           | 3.69       | 3.91  | 3.35  |
| mark 3     | light | orange (dot)                  | 3.05       | 3.24  | 2.77  |
| tint only  | light | orange (fill)                 | 2.80       | 2.97  | 2.54  |
| mark 3     | light | amber (dot)                   | 3.09       | 3.28  | 2.80  |
| tint only  | light | amber (fill)                  | 1.70       | 1.80  | 1.54  |
| mark 3     | light | indigo                        | 4.91       | 5.21  | 4.45  |
| mark 3     | light | green (dot)                   | 3.05       | 3.23  | 2.76  |
| tint only  | light | green (fill)                  | 2.97       | 3.16  | 2.70  |
| mark 3     | light | teal (dot)                    | 3.07       | 3.25  | 2.78  |
| tint only  | light | teal (fill)                   | 2.89       | 3.07  | 2.63  |
| mark 3     | light | purple                        | 4.88       | 5.18  | 4.43  |
| mark 3     | light | magenta                       | 3.88       | 4.12  | 3.53  |
| mark 3     | light | blue                          | 3.08       | 3.26  | 2.79  |
| mark 3     | light | brown                         | 3.38       | 3.59  | 3.07  |
| mark 3     | light | iris                          | 5.06       | 5.37  | 4.59  |
| mark 3     | light | lime (dot)                    | 3.07       | 3.26  | 2.79  |
| tint only  | light | lime (fill)                   | 1.93       | 2.05  | 1.75  |
| mark 3     | light | ink                           | 16.36      | 17.36 | 14.85 |
| mark 3     | light | pink (dot)                    | 3.03       | 3.22  | 2.76  |
| tint only  | light | pink (fill)                   | 1.99       | 2.11  | 1.81  |
| text 4.5   | dark  | foreground                    | 16.18      | 15.04 | 13.72 |
| text 4.5   | dark  | foreground/80                 | 10.54      | 9.96  | 9.24  |
| text 4.5   | dark  | muted-foreground              | 7.02       | 6.53  | 5.96  |
| text 4.5   | dark  | destructive                   | 8.20       | 7.62  | 6.96  |
| text 4.5   | dark  | success                       | 9.69       | 9.00  | 8.21  |
| text 4.5   | dark  | warning                       | 11.91      | 11.07 | 10.10 |
| text 4.5   | dark  | primary-foreground on primary | 16.18      | —     | —     |
| non-text 3 | dark  | input (control edge)          | 3.62       | 3.37  | 3.07  |
| non-text 3 | dark  | ring/50 (focus)               | 4.75       | 4.66  | 4.49  |
| mark 3     | dark  | red                           | 4.78       | 4.45  | 4.06  |
| mark 3     | dark  | orange (dot)                  | 6.30       | 5.86  | 5.34  |
| tint only  | dark  | orange (fill)                 | 6.30       | 5.86  | 5.34  |
| mark 3     | dark  | amber (dot)                   | 10.38      | 9.65  | 8.81  |
| tint only  | dark  | amber (fill)                  | 10.38      | 9.65  | 8.81  |
| mark 3     | dark  | indigo                        | 3.60       | 3.34  | 3.05  |
| mark 3     | dark  | green (dot)                   | 5.93       | 5.51  | 5.03  |
| tint only  | dark  | green (fill)                  | 5.93       | 5.51  | 5.03  |
| mark 3     | dark  | teal (dot)                    | 6.09       | 5.66  | 5.17  |
| tint only  | dark  | teal (fill)                   | 6.09       | 5.66  | 5.17  |
| mark 3     | dark  | purple                        | 3.62       | 3.36  | 3.07  |
| mark 3     | dark  | magenta                       | 4.54       | 4.22  | 3.85  |
| mark 3     | dark  | blue                          | 5.74       | 5.33  | 4.86  |
| mark 3     | dark  | brown                         | 5.21       | 4.84  | 4.42  |
| mark 3     | dark  | iris                          | 3.49       | 3.24  | 2.96  |
| mark 3     | dark  | lime (dot)                    | 9.15       | 8.51  | 7.76  |
| tint only  | dark  | lime (fill)                   | 9.15       | 8.51  | 7.76  |
| mark 3     | dark  | ink                           | 16.18      | 15.04 | 13.72 |
| mark 3     | dark  | pink (dot)                    | 8.86       | 8.23  | 7.51  |
| tint only  | dark  | pink (fill)                   | 8.86       | 8.23  | 7.51  |

- Every text pair passes 4.5:1 on all three surfaces in both modes.
- Track marks are checked on background and card, where they are placed. On `muted` several light-mode marks are below 3:1, so a mark never sits on `muted` without its value also shown as text (e.g. a progress bar next to its "৩/৬" fraction).
- "tint only" rows are the bright `track` value, which is not used as a mark in light mode.

## shadcn customisations

Generated shadcn components (`packages/ui/src/components/`) are added with the CLI and not edited, except for the changes listed here. Re-apply them whenever a component is regenerated.

| Component    | Change                                                                                                                                                                                                  | Why                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button.tsx` | Outline variant: `bg-card` fill and `hover:bg-muted` instead of `bg-input/30` / `hover:bg-input/50`.                                                                                                    | `--input` is darker than the design's line2 (3:1 control edges), so the generated fill turned grey; the design's outline buttons are white with a thin border. |
| `button.tsx` | Size map: `default` `h-11 px-5`, `lg` `h-12 px-6`, `icon` `size-11`, `icon-lg` `size-12`; `xs`, `sm`, `icon-xs` and `icon-sm` keep their size on a mouse and grow to 44px on touch (`pointer-coarse:`). | 44px touch targets ([Accessibility](#accessibility), [ADR-0008](decisions/ADR-0008-design-tokens.md)).                                                         |

Used as generated, with these notes:

- `sheet.tsx`: its built-in close button has an English "Close" label and its overlay uses `bg-black/80` (kept: a scrim carries no text). Every sheet uses `AppSheetContent` (`apps/web/components/app-sheet.tsx`) instead of `SheetContent`: it turns the built-in button off, adds a close button labelled through `t()`, and turns the slide off for reduced motion. The overlay fade is turned off for reduced motion in `globals.css`, since the wrapper cannot reach it.
- The CLI (`pnpm dlx shadcn@latest add <name> -c apps/web`) also adds `cn` to `apps/web/package.json`. The components live in `packages/ui`, which already depends on it, so revert that line.

## Style

- Pill buttons, 14–18px radius cards.
- 1px borders instead of heavy shadows.
- Generous whitespace.

## Accessibility

- 44px minimum touch targets.
- Visible focus.
- aria labels on icon-only controls.
- `prefers-reduced-motion` respected.
- WCAG AA contrast.
