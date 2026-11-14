# Design

**The visual system: design reference, tokens, fonts, track colours, style and accessibility rules.**

Reference: the design handoff (pages Home, Map, Topic, Lesson, Contents, Dashboard, Glossary), kept locally in `reference/handoff/` and not committed.

Tokens are CSS variables mapped onto the shadcn theme variables in `packages/ui`.

## Fonts

Loading rules (`next/font`, subsets, `swap`): [performance.md](development/performance.md#fonts).

- Anek Bangla — headings, 500–700
- Hind Siliguri — body, 400–600, line-height 1.85
- JetBrains Mono — code

## Colors

| Token   | Light     | Dark      |
| ------- | --------- | --------- |
| paper   | `#FAF8F3` | `#131210` |
| surface | `#FFFFFF` | `#1B1A17` |
| sunk    | `#F1EDE3` | `#24221E` |
| ink     | `#1C1A17` | `#F2EEE6` |
| ink2    | `#4A463F` | `#CBC5B8` |
| ink3    | `#69645A` | `#A49E91` |
| line    | `#E7E1D4` | `#2C2A25` |
| line2   | `#D3CBB9` | `#3E3B34` |
| ok      | `#1E7A4C` | `#5BD08F` |
| bad     | `#B4322C` | `#FF8A80` |

## Track colors

| Track         | Color     | Light-mode override |
| ------------- | --------- | ------------------- |
| cs            | `#E5484D` |                     |
| lang          | `#F76B15` |                     |
| tools         | `#FFB224` | dots `#D99400`      |
| frontend      | `#3E63DD` |                     |
| backend       | `#30A46C` |                     |
| database      | `#12A594` |                     |
| security      | `#8E4EC6` |                     |
| testing       | `#D6409F` |                     |
| devops        | `#0090FF` |                     |
| system-design | `#A18072` |                     |
| ai            | `#5B5BD6` |                     |
| mobile        | `#8CC63F` | `#6A9F22`           |
| practices     | ink       |                     |
| soft-skills   | `#FF8DCC` | `#E063A8`           |

The track color is set in the track's `_meta.json` and is the accent of every lesson page in that track.

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
