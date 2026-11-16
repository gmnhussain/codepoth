# Design

**The visual system: design reference, tokens, fonts, track colours, style and accessibility rules.**

Reference: the design handoff (pages Home, Map, Topic, Lesson, Contents, Dashboard, Glossary), kept locally in `reference/handoff/` and not committed.

Tokens are CSS variables mapped onto the shadcn theme variables in `packages/ui`.

## Fonts

Loading rules (`next/font`, subsets, `display: "optional"`): [performance.md](development/performance.md#fonts). On a slow first visit a page may render in the system's fallback fonts; the next page uses the web fonts. Loaded in `apps/web/app/layout.tsx`.

| Font           | Use                    | Loaded as                     | Utility        |
| -------------- | ---------------------- | ----------------------------- | -------------- |
| Anek Bangla    | headings (`h1`–`h4`)   | variable font, one file       | `font-heading` |
| Hind Siliguri  | body, UI               | static, weights 400, 500, 600 | `font-sans`    |
| JetBrains Mono | code, numbers in chips | variable font, Latin only     | `font-mono`    |

- next/font exposes `--font-display`, `--font-body` and `--font-code`; `globals.css` maps them to `font-heading`, `font-sans` and `font-mono`. The names differ from the Tailwind theme variables so no variable refers to itself.
- Code shows no ligatures (`font-variant-ligatures: none` in `globals.css`), so `=>` and `!==` look the way a beginner types them.
- JetBrains Mono has no Bangla glyphs, so `font-mono` falls back to Hind Siliguri for Bangla text in code (comments, strings).
- Anek Bangla and Hind Siliguri are preloaded (Bangla + Latin subsets): 8 files, 339.3 KB. JetBrains Mono is not preloaded and adds 40.1 KB on pages with monospace text, 379.4 KB in all. Measured with Lighthouse on 2026-11-15 on Home, a lesson and the Map: fonts finish before the first paint and do not delay LCP (measured with `font-display: swap`; `optional` renders such loads the same way). Per-file numbers: [performance.md](development/performance.md#font-bytes).
- Heading weights in use: 500–700. Body line height: `leading-reading` (1.85, see [Type scale](#type-scale)).

## Colors

Tokens live in `packages/ui/src/styles/globals.css`, mapped onto the shadcn variables so every shadcn component picks them up ([ADR-0008](decisions/ADR-0008-design-tokens.md)). Components use Tailwind utilities on these tokens only, never hex values.

| Design name | Token (utility)                                                                    | Light     | Dark      |
| ----------- | ---------------------------------------------------------------------------------- | --------- | --------- |
| paper       | `background`                                                                       | `#FAF8F3` | `#131210` |
| surface     | `card`, `popover`                                                                  | `#FFFFFF` | `#1B1A17` |
| sunk        | `muted`, `secondary`, `accent`                                                     | `#F1EDE3` | `#24221E` |
| ink         | `foreground`, `primary`, `ring`                                                    | `#1C1A17` | `#F2EEE6` |
| ink2        | `foreground/80` (opacity modifier, no token)                                       | —         | —         |
| ink3        | `muted-foreground`                                                                 | `#69645A` | `#A49E91` |
| line        | `border`                                                                           | `#E7E1D4` | `#2C2A25` |
| line2       | `foreground/20` for decorative edges (dashed cards, chips)                         | —         | —         |
| —           | `input` (control edges, 3:1)                                                       | `#8C877B` | `#6F6D68` |
| ok          | `success`                                                                          | `#1E7A4C` | `#5BD08F` |
| bad         | `destructive`                                                                      | `#B4322C` | `#FF8A80` |
| warn        | `warning`                                                                          | `#9A5B00` | `#FFC46B` |
| code        | `code` (code-block background, [ADR-0010](decisions/ADR-0010-dark-code-blocks.md)) | `#1C1A17` | `#0C0B0A` |
| —           | `code-foreground` (caption and line numbers on `code`)                             | `#EDE8DE` | `#EDE8DE` |

- The heatmap uses `bg-muted` (no activity), `bg-success/35`, `bg-success/65` and `bg-success`.
- The shadcn `chart-*` and `sidebar-*` slots are kept and point at the same palette.
- Code blocks are dark in both modes: background `bg-code`, text colours from one Shiki theme, Catppuccin Mocha ([ADR-0010](decisions/ADR-0010-dark-code-blocks.md)). `packages/content/src/mdx/code-theme.test.ts` checks every token colour of the theme at 4.5:1 on both `--code` values (lowest today: 6.15:1). Inline `code` in prose is not highlighted.
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

## Site header

`components/site-header.tsx`, on every page: brand, page links (from `lg`), search, theme toggle and the menu button (below `lg`).

- Brand (`brand-link.tsx`): logo, the Bangla site name and the English tag, all from `site.ts`. Below `sm` the header's brand drops the English tag (the footer keeps it), so the header fits 320px, the WCAG reflow width. The link's name is its visible text plus a visually hidden "— হোম" (`site.homeSuffix`), not an `aria-label`, so it contains every visible word (WCAG 2.5.3).
- Search button (`components/search/search-button.tsx`): a pill with the search icon, "খুঁজো" from `lg` and the shortcut box (`⌘K` on Apple devices, `Ctrl K` elsewhere) from `sm`; below `sm` a 44px icon button. The box holds both keys in one grid cell with only the reader's visible, so it keeps one width when the platform is known after hydration. The name is "খুঁজো", from its own text (visually hidden below `lg`), never an `aria-label`: WCAG 2.5.3 wants every visible word in the name, and the shortcut box is `aria-hidden`; `aria-keyshortcuts` names the shortcut.
- Theme toggle (`theme-toggle.tsx`): an action button named for what it does ("ডার্ক মোডে যাও" / "লাইট মোডে যাও"), not a toggle with `aria-pressed`. From `sm` it is the square icon button in the header. Below `sm` there is no room for it, so it moves into the menu sheet under the links, as the same component with its name shown beside the icon. The copy not in use is `display: none`, so one theme control is in the accessibility tree at any width.
- Below `sm` the header holds the brand (125px), search and the menu button. Measured on 2026-11-15: at 320px the menu button ends at 304px and the page does not scroll sideways (also at 375 and 640px, light and dark).

## Search

Site search with Pagefind ([ADR-0015](decisions/ADR-0015-site-search-with-pagefind.md)); the index covers lessons, topics, glossary terms and About.

- Opens from the header button or ⌘K / Ctrl+K on any page (the physical K key, so a Bangla keyboard layout works too); the shortcut while open moves focus back to the field.
- Dialog (`components/search/search-dialog.tsx`, Base UI `Dialog`): anchored near the top (96px; 16px below `sm`), not centred, so a growing list never moves the field. The field is labelled "খোঁজার শব্দ"; the close button shows "Esc" and is named "বন্ধ করো (Esc)", so its name contains its visible text. Base UI traps focus, closes on Escape and returns focus to where it was: the button, or the element focused when ⌘K was pressed.
- States: empty (a hint and the shortcut); loading the index; results with their count ("{n}টি ফল") in a status line; no results ("“{query}” দিয়ে কিছু পাওয়া যায়নি।", a hint and a link to `/contents?q=…`); unavailable when Pagefind cannot load (in `next dev`, or a failed request), with a link to the contents page. The status line is always rendered, so what it says is announced.
- Rows (`search-results.tsx`): the track's dot, the title, where it sits (track · topic; "·" on screen, a comma for screen readers) and the kind (পাঠ, স্টেশন, পরিভাষা, পাতা; the topic word follows the label set). One row per page, so one lesson never fills the list; each matching glossary term is its own row (at most 5); at most 10 rows. A term links to its card with a plain `<a>`, so `:target` updates; other rows are `next/link`. Following a row closes the dialog.
- Keyboard: ↓ from the field moves into the results, ↑/↓ between them, ↑ from the first back to the field; Tab works as usual.
- A query with Bangla endings (-এর, -কে, -তে, -গুলো…) also runs with them trimmed, and what that finds is added after the reader's own results ([ADR-0015](decisions/ADR-0015-site-search-with-pagefind.md#bangla)).
- From the handoff: the button, the shortcut box, the top-anchored card, the field with its hidden label and the Esc close button, and the result row (dot, title, kind). Added: the place line and the result count. Not built: "জনপ্রিয় খোঁজ", which would need tracking.
- Chrome's own clear button (×) in the search field is kept, as in the glossary's field.

## Lesson blocks

The MDX components for lesson bodies live in `apps/web/components/mdx/` and are rendered on the server.

- Each block is a `<section>` with the block's id and a numbered `h2` (`০১` …, computed; the summary has no number). Author sections are `h3`.
- `<Summary>`: tinted card in the track colour (`border-track/30 bg-track/5`).
- `<Mistakes>` and `<Steps>`: the author writes a plain numbered list; the component renumbers it with Bangla digits (round badges for mistakes, "ধাপ ১" cards for steps).
- `<DeepDive>`: a native `<details>`, closed by default, with the "অভিজ্ঞদের জন্য" chip and the one-line `hint`.
- Code blocks: see [Colors](#colors) and [ADR-0010](decisions/ADR-0010-dark-code-blocks.md); file name in the caption, Bangla line numbers that screen readers skip.
- Tables scroll sideways inside a bordered card on narrow screens.
- Interactive islands (client components, the only JavaScript in a lesson body):
  - Copy buttons on every code block and AI prompt. They read the text from the page (no copy of it in the bundle), trim trailing spaces, and announce "কপি হয়েছে" through a status region.
  - `<Term>`: a dotted-underline button opening a popover with the server-rendered definition; Escape closes it and focus returns to the term.
  - `<Quiz />`: one fieldset per question whose options are buttons, not radios, so arrow keys never answer by accident: Tab moves between options, Enter or Space answers. An answered question locks (`aria-disabled`, so focus stays) and shows ✓/✗, the explanation in a live region, the score and "আবার চেষ্টা করো". `backtick` spans in quiz text show as inline code. Answering the last question saves the attempt (score and total) in the reader's progress; only the latest attempt is kept ([ADR-0007](decisions/ADR-0007-reader-progress-shape.md)).
  - `<Term>`'s trigger has no `aria-label`: its visible text is its name (WCAG 2.5.3).

## Lesson page

`/learn/[track]/[topic]/[lesson]` (`apps/web/app/learn/…/page.tsx`), accent from the lesson's home track.

| Width        | Left: track navigation                                               | Right: "এই পাঠে"                           |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------ |
| `xl` and up  | Sticky column                                                        | Sticky column, follows the scroll position |
| `lg` to `xl` | Sticky column                                                        | Collapsible bar above the summary          |
| Below `lg`   | Drawer (`AppSheetContent`, left) from a button beside the breadcrumb | Collapsible bar above the summary          |

- Track navigation: the track's topics on a vertical line in the track colour; interchange topics have a ring. The current topic opens to its groups (`<details>`, current group open) or loose lessons; the current lesson is marked (`aria-current="page"`). A note explains an interchange. The nav sets its own `data-track-color`, because the drawer renders outside the page wrapper.
- Header chips (track · line, position): below `sm` one line that scrolls sideways, never wrapped, so the header's height does not depend on the font; a focusable region named "পাঠের তথ্য" so the keyboard can scroll it. From `sm` they wrap.
- Tables in lesson bodies scroll sideways inside a focusable region named "টেবিল" (markdown tables have no caption); code blocks, in the lesson and in quiz questions, are focusable for the same reason.
- "এই পাঠে": the lesson's blocks with the author's `###` sections nested under them, numbered like the blocks, and prev/next. The current entry (`aria-current="location"`) follows the scroll position; a link into the closed deep dive opens it first.
- Reader progress ([ADR-0014](decisions/ADR-0014-reader-progress-implementation.md)): every mark renders its first-visit state on the server and changes in place after hydration, so nothing moves.
  - Header: below the meta line (a top border), "বুকমার্ক" and "পাঠ শেষ" toggles. Their labels never change; `aria-pressed` carries the state, so a screen reader announces it once (ARIA toggle-button pattern). The eye sees a filled bookmark, and the done toggle turns primary with its tick. Fixed labels also mean a state change never changes the button's width. If saving fails, a status line under them says so and the toggle keeps its state.
  - Track navigation: each lesson has a 16px state mark (filled tick: done, ring with a dot: in progress, ring: not started; `role="img"` with the state as its name); each group and topic a "২/৩" count (`aria-hidden`, read as "৩টির ২টি শেষ"), right-aligned in a box as wide as "total/total"; a finished group shows a tick in a slot that is always there. A note under the nav: "টিক চিহ্ন তোমার নিজের অগ্রগতি — এই ব্রাউজারে সেভ থাকে।"
  - "তোমার অগ্রগতি" card under the sidebar TOC (from `xl`): the group's "{total}টির {done}টি শেষ" with a bar in the track colour, then the topic's with a thin muted bar (a lesson outside a group shows the topic only). Bars are shadcn `progress` (Base UI), named by their visible text.
  - Opening the page records the lesson as opened; the reader's section is saved for the resume link once it has changed at least once.

## Topic page

`/learn/[track]/[topic]`, only for topics with a lesson in the build (ADR-0009), accent from the topic's home track.

- Header: breadcrumb, the track strip (topics on a horizontal line, the current one larger; scrolls sideways on narrow screens), title, description, chips (track · line, position, lesson count, total time, group count) and, for an interchange, the other tracks.
- "শুরু করো" card linking to the first lesson.
- "পাঠসমূহ": each group as a section with id `group-{slug}` (the lesson breadcrumb's group links here), its description, lesson count and total time, then its lessons (number, title, minutes) as 48px rows.
- "আগে যা জানা দরকার" (prerequisites) and "এরপর" (the next topic on the track) as cards.
- Topic names are links everywhere; a planned topic (no published lesson) is plain text marked "পরিকল্পনায় আছে".
- The track strip starts with the current topic centred (a small island sets the strip's `scrollLeft`; no `scrollIntoView`, no smooth scroll).
- Numbered rows (here and in later lists such as Contents and the roadmap): the number is `aria-hidden` (the `<ol>` gives the order) and short units get a screen-reader form, so a row's name reads "JSX, ১ মিনিট", not "১JSX১ মি".
- Totals are whole hours from 90 minutes, otherwise minutes rounded to 5 (`roundedDuration`).
- Reader progress ([ADR-0014](decisions/ADR-0014-reader-progress-implementation.md)), with no layout shift:
  - The card after the header shows where the reader stands. Not started (also the first-visit HTML): "এই স্টেশন শুরু করো" with the first lesson. In progress: "এই স্টেশনে তোমার অগ্রগতি", "{total}টির {done}টি শেষ" with a bar in the track colour, "পরের পাঠ: {lesson} · {group}" (the next unfinished lesson) and "চালিয়ে যাও". All done: a full bar, "পরের স্টেশন: {topic}" when the next topic has a page, and "আবার দেখো" (the first lesson). Then "অগ্রগতি শুধু এই ব্রাউজারে সেভ থাকে।". All states are stacked in one grid cell with only one visible, plus an invisible "in progress" layer with the topic's longest lesson title, so the card's height is fixed from the first render.
  - Groups: every group is a padded frame with a border; the one holding the lesson to continue with turns tinted (`border-track/30 bg-track/5`) and gets an "এখন পড়ছ" chip; a finished group gets "গ্রুপ শেষ". The kicker line is always chip-tall. Under the group's count and time, "{total}টির {done}টি শেষ" with a bar.
  - Lesson rows: a state mark before the number (hidden from screen readers) and the state in words before the minutes ("পড়া শেষ", "পড়ছ", "শুরু হয়নি", or "এখান থেকে" on the lesson to continue with), in a slot as wide as the longest of those; it is part of the row link's name. Below `sm` the words are screen-reader only (the slot would squeeze the titles) and the mark shows the state.
  - The track strip's dots do not show progress yet.

## Contents page

`/contents`: the whole curriculum, tracks → topics → groups → lessons, in reading order.

- Header: title, intro and computed stats (tracks, topics, lessons).
- Toolbar (client island, `contents-controls.tsx`): a search field and "সব খোলো / সব বন্ধ করো". Search matches every word of the query against a lesson's title, its group and its topic (`matchesQuery` in `packages/content/src/search.ts`). Matching lessons stay visible with their groups, topics and tracks, all opened; the count is announced in a status line. Clearing the search restores what was open before. The query lives in `?q=` (conventions §10): written with `history.replaceState` as the reader types (no history entry per keystroke), applied on load, removed when cleared. Pages with URL state read it with `useUrlParam` (a `useSyncExternalStore` hook: "" on the server and during hydration, the URL's value on the client, updated by `writeUrlParams` and back/forward) and change it with `writeUrlParams`, both in `apps/web/lib/url-state.ts`. The URL is the only copy of that state: counts are derived from data passed as props, and effects keyed on the values only update the DOM. No `requestAnimationFrame` for state or focus: it never fires in a page that is not being rendered (a background tab, a hidden pane). A link to a `#section` on another page whose look depends on `:target` (the glossary card, the privacy section) is a plain `<a>`: `next/link` changes the hash with `pushState`, which scrolls but does not update `:target`. `useUrlParam` hears `popstate` and `writeUrlParams`, not Next's own `pushState`: a control that changes only the query on the same page calls `writeUrlParams` rather than rendering a `<Link>` (links into these pages from other pages are fine, since the page mounts with the new URL).
- The list is server-rendered native `<details>`, so it works without JS. The first track starts open, the rest closed; groups start closed. The island only sets `hidden` and `open`.
- Each track's summary is a grid: number badge, name and subtitle, the read count, chevron in one row from `sm`; below `sm` the read count moves under the subtitle so the row fits in 320px.
- Each track: number badge, name (the `h2`), subtitle with topic and lesson counts, then its topics on a line in the track colour: topic link (`h3`), position, lesson count, an interchange chip, then its groups (`h4` in a `<details>`) or lessons. A topic whose home is another track shows "পাঠগুলো {track} লাইনে →" instead of lessons, linking to `#track-{id}`.
- Each track's summary is a grid: number badge, name and subtitle, the read count, chevron in one row from `sm`; below `sm` the read count moves under the subtitle so the row fits in 320px.
- Lesson numbers are track.topic.lesson (`৪.৪.৩`), `aria-hidden`, and hidden below `sm`.
- "লাইনে যাও" (from `lg`): plain `<a href="#track-…">` links, so `hashchange` fires and the island opens the target track. In-page links that must open a `<details>` use `<a>`, not `next/link`, which changes the hash without that event.
- The `#track-…` id is on a zero-height marker inside the track's `<details>` content (not its `<summary>`), at the top of the track card with `scroll-mt-24`. Browsers with "ancestor details revealing" (Chrome, Edge) open the closed track themselves, also without JavaScript. The island's fallback runs in every browser on load and on `hashchange`: it does nothing when the track is already open, and otherwise opens it and scrolls to it. Known issue: a cold load of `/contents#track-…` with JavaScript on can still shift (3 of 56 loads in Phase 5), when Chrome draws a frame while the page is still being parsed, before it opens the track; warm loads measure 0 ([performance.md](development/performance.md#known-layout-shift)).
- Reader progress ([ADR-0014](decisions/ADR-0014-reader-progress-implementation.md)), with no layout shift:
  - Status filter before the search: "সব / বাকি / পড়া শেষ" toggle buttons (`aria-pressed`, fixed labels) with each count in a box as wide as the total. "বাকি" is every lesson not done. It lives in `?status=todo|done` like the search's `?q=` (no parameter: all), combines with the search, uses the same hide/open/restore logic, and "ছাঁকনি মুছে দাও" in the empty state clears both. Pure helpers in `lib/progress/status-filter.ts`.
  - Header: a fourth stat, "তুমি পড়েছ" (lessons done), in a box as wide as the total.
  - Each track's summary: "{done}/{total} পড়া" with a thin bar in the track colour, at a fixed width; the jump links show "d/t".
  - Groups: "এখন পড়ছ" on the group holding the topic's lesson to continue with, "গ্রুপ শেষ" when finished, and "d/t" instead of the lesson count.
  - Lessons: the state mark (named by its state) before the number, and "এখানে থেমেছিলে" on the last-read lesson (screen-reader only below `sm`).

## Roadmap page

`/roadmap`: every track and topic as a metro-style map, drawn from `content/map.json` ([content model: Map](content-model.md#map)).

- Data: `buildRoadmap(graph)` in `packages/content/src/roadmap.ts` gives the canvas size, track lines and each topic's position, flags and lesson tree; `isTopicVisible` (track focus, start-only, search) and `topicNeighbours` are tested there.
- Drawing (`roadmap-canvas.tsx`, hook-free so Home can reuse it as a static preview): SVG polylines in the track colour, a label per topic placed by `map.json`'s `label`, "শুরু এখান থেকে" flags on start topics, and a button per topic (interchanges have a larger dot with a dark ring). Positions come from data, so they are inline `left`/`top`/size styles; colours and look stay in classes. Topics are in track order, which is the keyboard order.
- Each topic's hit area counter-scales with the zoom, so it stays 44px on screen at 50–120 %.
- Island (`roadmap-explorer.tsx`): track focus (legend column from `md`, a chip row below it), "সব / শুরুর স্টেশন", topic search, zoom (−/+, 50–120 %, opens at 80 %), and the topic panel. Filtering dims topics and lines (`opacity-15`); a status line announces the count. State lives in the URL: `?topic=&track=&q=&filter=start`, through `lib/url-state.ts`; a shared link opens with the topic's panel and the map centred on it.
- Topic panel (`roadmap-panel.tsx`): track chips, kicker (line, position), name, description, lessons and reading time, "শুরু করো" to the first lesson and the topic page, the lessons (groups as `<details>`, the first open), the interchange note, the home track's topics (select another) and previous/next. Beside the map from `md`, where picking a topic moves focus to the panel's heading and Escape closes it and returns focus to the dot; a bottom sheet below `md`.
- Planned topics (no published lesson) are on the map, muted, with "পরিকল্পনায় আছে" and no start or topic-page link.
- Links in: the breadcrumbs' "রোডম্যাপ" and track (`/roadmap?track=…`), the header and footer, and the not-found page.
- Reader progress ([ADR-0014](decisions/ADR-0014-reader-progress-implementation.md)):
  - Dots: `StationDot` (`components/station-dot.tsx`, hook-free) fills a topic's dot by its lessons' state: filled when all are done, a ring with a centre dot while in progress, an empty ring before. The canvas takes an optional `stateOf`; without it (Home's static preview, the first-visit HTML) every dot is a ring. A dot button's name adds the state for topics with lessons. Filter, dot names, key and panel chip use the site's one set of state words, the `status.*` labels the lesson marks use: "পড়া শেষ", "পড়ছ", "শুরু হয়নি". The topic page's track strip uses the same dot through `TopicStateDot`; its current topic is shown by size and weight, not by fill.
  - Filter: one choice of "সব / শুরুর স্টেশন / পড়া শেষ / পড়ছ / শুরু হয়নি" in `?filter=start|done|reading|todo` (none: all), scrolling sideways inside its pill when it does not fit. Planned topics (no lessons) are left out of the three state filters. Pure helpers in `lib/progress/roadmap-filter.ts`.
  - Legend: a "তোমার অগ্রগতি" box at the top (lessons done of all, a bar, "লগইন ছাড়াই — এই ব্রাউজারে সেভ থাকে"), always rendered; each track button shows its own lessons' "d/t" (reserved width) and a thin bar in the track colour.
  - The key pill (from `lg`) shows the three states and the interchange mark; it is `aria-hidden`, since every dot's name says its state.
  - Panel: a state chip, "তোমার অগ্রগতি" with "d/t" and a bar, and the main button per state: "শুরু করো" (first lesson), "চালিয়ে যাও" with "পরের পাঠ: {lesson} · {group}" (the next unfinished lesson), or "আবার পড়ো" with "সব পাঠ শেষ — চাইলে আবার দেখো" (first lesson). Lesson rows get their state marks. Topic bookmarks are not offered ([ADR-0007](decisions/ADR-0007-reader-progress-shape.md)).

## Glossary page

`/glossary`: every term in this build, A–Z.

- Header: title, intro and a sample of the dotted underline that marks a `<Term>` in lessons.
- Controls (client island, `glossary-controls.tsx`): a search field (term, Bangla name and the definition's prose; code examples are left out, `glossarySearchText`) with a count, and an A–Z bar ("সব" plus a button per letter, disabled when no term starts with it; "#" appears only for terms not starting with A–Z). Search and letter combine; the result count is announced; with no match, a card offers "সব পরিভাষা দেখাও". State lives in `?q=&letter=` (`lib/url-state.ts`).
- Terms are server-rendered cards in letter sections (`term-card.tsx`): term (`lang="en"`), Bangla name, track chip, the definition with its code example (the same components as the popover, `definition-components.tsx`), and "যে পাঠে আছে": each lesson as track › topic › group › lesson (the `›` is hidden from screen readers and read as a comma).
- A card's heading (`h3`) has the term id, so the Term popover's "পরিভাষায় দেখো →" link (`/glossary#<id>`) lands on it, with the card's padding in view (`scroll-mt-30`); the card is outlined while it holds the `:target` (`has-[:target]`). The id is on the heading, not the card, because a heading with an id is what makes each term its own search result ([ADR-0015](decisions/ADR-0015-site-search-with-pagefind.md)).
- With no published term (the production build today) the page shows an empty state instead of the controls.

## Home page

`/`, every number computed (`graph.stats`), every string from the label set.

- Hero: chip, title, text with the track count, "শুরু করো" and "রোডম্যাপ দেখো", and a static SVG of the whole map (`roadmap-preview.tsx`, from `buildRoadmap`) linking to the roadmap. "শুরু করো" goes to the first published lesson along the start routes (`homeStartLesson`, ADR-0009) with a "প্রথম পাঠ: …" line; with nothing published it goes to `/roadmap` and the line says lessons are coming.
- Stats: tracks, topics, lessons and quiz questions. The design's "১০০% বাংলা" is left out: it is not a computed count.
- "কোথা থেকে শুরু করবে?": a card per route in `start-routes.json` (`start-route-card.tsx`): level with filled dots by position, title, description, the suggested route (topics without a published lesson are muted and marked planned for screen readers), and a button to the first topic on it with a page, else "রোডম্যাপ থেকে বেছে নাও".
- The tracks as cards linking to `/roadmap?track=…`, with topic and lesson counts.
- "কেন কোডপথ?": six tiles (lucide icons, copy in labels).
- "নতুন কী" (`#new`): `recentLessons` (5), dated by the later of published/updated, tagged "নতুন"/"হালনাগাদ" by `freshnessOf(siteToday())`; an empty state while nothing is published.
- Author block (`#author`): name, bio and initials from `site.author`; only the profile links that are set render.
- Resume ([ADR-0014](decisions/ADR-0014-reader-progress-implementation.md)): instead of a separate card, the hero's main button and the line under it (`home/hero-start.tsx`). A first visit, and the prerendered HTML, shows "শুরু করো" and "প্রথম পাঠ: …". A returning reader gets "চালিয়ে যাও" to the last-read lesson at its saved section, and "যেখানে থেমেছিলে: {lesson} · {group} গ্রুপের {total}টির {done}টি শেষ" (the topic instead of the group for a lesson outside any group). The lesson data comes from `/lessons.json`, a prerendered route handler (`app/lessons.json/route.ts`, `dynamic = "force-static"`) built from the same content graph as the pages, so drafts follow the same rule: each lesson's title, URL and scope, and each scope's (group's, or topic's) title and lesson ids. The island fetches it only when a last read exists, after hydration, so first-time visitors never download it. A failed request, a response that fails the shape check (`parseResumeIndex`) or a lesson missing from it all keep the first-visit view, with no error. Both button texts share one grid cell (fixed width); the line is held at two lines tall and the resume text is clamped to two, so the resume appears without moving anything, however late the file arrives. `resumeOf` and `parseResumeIndex` in `lib/progress/resume.ts` are tested.

## Dashboard page

`/dashboard` ([ADR-0014](decisions/ADR-0014-reader-progress-implementation.md)): title, subtitle and a chip ("এখনো কিছু সেভ হয়নি", or "শেষ সেভ: {date}" once something is saved), then the body (`dashboard/dashboard-view.tsx`):

- Until the reader's progress is read (`useProgressReady()`, false on the server), the body is an empty, busy placeholder with a screen-reader "তোমার অগ্রগতি পড়া হচ্ছে…", so a returning reader never sees the empty state flash. The prerendered HTML is that placeholder, with the empty state in `<noscript>`. The body is at least a screen tall (`min-h-svh`) in every state, so switching states moves nothing in view.
- Nothing saved: the empty-state card (a line with only the first station reached, a welcome, and what will collect here). "প্রথম পাঠ শুরু করো" goes to the same lesson as Home's "শুরু করো" (`homeStartLesson`) and is left out while nothing is published, when "রোডম্যাপ দেখো" becomes the main button.
- Otherwise, in two columns from `lg`:
  - "মোট অগ্রগতি": the share of all lessons done (a large percent and a bar), "পুরো কারিকুলামের {total}টি পাঠের মধ্যে।", and three counts: lessons done, quizzes taken, topics finished.
  - "শেষবার পড়েছ" beside it (from `lg`): the last-read lesson's "track · topic › group" and title, its group's "{group} গ্রুপের {total}টির {done}টি শেষ" (or the topic's) with a bar, and "চালিয়ে যাও" to the lesson at its saved section. It uses `resumeOf`, like Home, and is left out when there is no last read or the lesson is not in the build; the overall card then spans both columns.
  - "লাইনভিত্তিক অগ্রগতি": each track with lessons, a bar in its colour (named "{track}: {total}টি পাঠের {done}টি পড়া") and "d/t".
  - "আমার ম্যাপ": Home's SVG preview (`RoadmapPreview`) with `stateOf`: lines faded, each dot filled when done, a centre dot while in progress, a faded ring before; it links to the roadmap. A key counts the topics in each state with `StationDot` marks and the `status.*` words.
  - "কুইজের ফলাফল": average score (each quiz weighted equally), questions answered, and the four weakest quizzes with place, date, a score bar in `warning` and "আবার চেষ্টা করো" to the lesson's `#quiz`. Without quizzes, a line saying so.
  - "বুকমার্ক": newest first, each with place, "সেভ {date}" and a remove button named "{lesson} বুকমার্ক থেকে সরাও". Removing announces "“{lesson}” বুকমার্ক থেকে সরানো হয়েছে।" and moves focus to the list's heading.
  - "যেদিন পড়েছ": 20 weeks × 7 days as an SVG grid in the four heatmap shades (none, 1, 2–3, 4+ lessons; `heatLevelOf`), "গত ২০ সপ্তাহে {n} দিন পড়েছ।" and a কম–বেশি key. The grid is `aria-hidden`; a visually hidden table gives every day's count.
- The page's data (every lesson's title, URL, scope and "track · topic › group", each scope's title and lessons, tracks and topics with their lessons, and a trimmed map) is built on the server (`lib/dashboard-data.ts`, reusing `resumeIndexOf`) and inlined in the page; why it is inlined here and fetched on Home is in [ADR-0014](decisions/ADR-0014-reader-progress-implementation.md).
- "তোমার ডেটা" (last, full width): "তোমার তথ্য শুধু এই ব্রাউজারেই থাকে।", the hint, and three actions ([ADR-0007](decisions/ADR-0007-reader-progress-shape.md), [ADR-0014](decisions/ADR-0014-reader-progress-implementation.md)):
  - "প্রগ্রেস এক্সপোর্ট" downloads `codepoth-progress.json` (the export format's name) with `{ format, version, exportedAt, data }`.
  - "ইমপোর্ট" opens the file picker; the empty state has the same as "এক্সপোর্ট করা ফাইল ইমপোর্ট করো" under its card (not in the `<noscript>` copy, where it could not work). A file over 1 MB is refused on `File.size` before reading; then the whole file is validated, and too large, not JSON, wrong format, unsupported version and invalid data each have their own message, followed by "তোমার আগের অগ্রগতি যেমন ছিল তেমনই আছে।". With progress already here, a shadcn `dialog` asks "দুটো মিলিয়ে নাও" (primary, the ADR-0007 merge) or "ফাইলেরটা দিয়ে বদলে দাও", or cancel; with none, the file becomes the progress. After an import from the empty state, focus moves to "মোট অগ্রগতি".
  - "সব মুছে ফেলো" asks first in a shadcn `alert-dialog` with the design's warning, then removes the stored key; the view returns to the empty state and focus moves to its heading.
  - The import and export code (with Zod) loads on use, not with the page.
- Results ("…ফাইলটা ডাউনলোড হয়েছে…", "…থেকে প্রগ্রেস ইমপোর্ট হয়েছে।", "সব তথ্য … মুছে ফেলা হয়েছে।", import errors, a failed save) appear in one message bubble fixed at the bottom of the screen with a close button, so a message never moves the page; an always-present, visually hidden `role="status"` region announces each one; it outlives a switch between the dashboard and the empty state. No toast library.

## About page

`/about` (no design reference; laid out like the other text pages, `max-w-3xl`): the H1, lead and "হালনাগাদ" date from `content/pages/about.mdx`, the author block (Home's `AuthorCard`), then the MDX prose (`about-components.tsx`, which spreads the paragraphs, lists, links and inline code lessons use from `mdx/prose-components.tsx`), where `<Privacy>` renders the `#privacy` card the footer links to. The footer's "সাইট" column shows "সম্পর্কে" (`/about`) and "প্রাইভেসি" (`/about#privacy`) only when the build shows the page (ADR-0012).

## shadcn customisations

Generated shadcn components (`packages/ui/src/components/`) are added with the CLI and not edited, except for the changes listed here. Re-apply them whenever a component is regenerated.

| Component    | Change                                                                                                                                                                                                  | Why                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button.tsx` | Outline variant: `bg-card` fill and `hover:bg-muted` instead of `bg-input/30` / `hover:bg-input/50`.                                                                                                    | `--input` is darker than the design's line2 (3:1 control edges), so the generated fill turned grey; the design's outline buttons are white with a thin border. |
| `button.tsx` | Size map: `default` `h-11 px-5`, `lg` `h-12 px-6`, `icon` `size-11`, `icon-lg` `size-12`; `xs`, `sm`, `icon-xs` and `icon-sm` keep their size on a mouse and grow to 44px on touch (`pointer-coarse:`). | 44px touch targets ([Accessibility](#accessibility), [ADR-0008](decisions/ADR-0008-design-tokens.md)).                                                         |

Used as generated, with these notes:

- `sheet.tsx`: its built-in close button has an English "Close" label and its overlay uses `bg-black/80` (kept: a scrim carries no text). Every sheet uses `AppSheetContent` (`apps/web/components/app-sheet.tsx`) instead of `SheetContent`: it turns the built-in button off, adds a close button labelled through `t()`, and turns the slide off for reduced motion. The overlay fade is turned off for reduced motion in `globals.css`, since the wrapper cannot reach it.
- `dialog.tsx`: its built-in close button has an English "Close" label, so every dialog passes `showCloseButton={false}` and closes with its own labelled control (the import dialog's "বাতিল", the search dialog's "বন্ধ করো (Esc)").
- `input.tsx`: its `bg-input/30` fill turns grey for the same reason as the button's; search fields pass `bg-background` (the design's paper colour) and `h-11` where they are used.
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
