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
- Code shows no ligatures (`font-variant-ligatures: none` in `globals.css`), so `=>` and `!==` look the way a beginner types them.
- JetBrains Mono has no Bangla glyphs, so `font-mono` falls back to Hind Siliguri for Bangla text in code (comments, strings).
- Anek Bangla and Hind Siliguri are preloaded (Bangla + Latin subsets, about 340 KB across 8 files measured on the first build); JetBrains Mono is not. Re-measure with Lighthouse when the pages exist.
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
  - `<Quiz />`: one fieldset per question whose options are buttons, not radios, so arrow keys never answer by accident: Tab moves between options, Enter or Space answers. An answered question locks (`aria-disabled`, so focus stays) and shows ✓/✗, the explanation in a live region, the score and "আবার চেষ্টা করো". `backtick` spans in quiz text show as inline code. The score is not saved yet (reader progress).
  - `<Term>`'s trigger has no `aria-label`: its visible text is its name (WCAG 2.5.3).

## Lesson page

`/learn/[track]/[topic]/[lesson]` (`apps/web/app/learn/…/page.tsx`), accent from the lesson's home track.

| Width        | Left: track navigation                                               | Right: "এই পাঠে"                           |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------ |
| `xl` and up  | Sticky column                                                        | Sticky column, follows the scroll position |
| `lg` to `xl` | Sticky column                                                        | Collapsible bar above the summary          |
| Below `lg`   | Drawer (`AppSheetContent`, left) from a button beside the breadcrumb | Collapsible bar above the summary          |

- Track navigation: the track's topics on a vertical line in the track colour; interchange topics have a ring. The current topic opens to its groups (`<details>`, current group open) or loose lessons; the current lesson is marked (`aria-current="page"`). A note explains an interchange. The nav sets its own `data-track-color`, because the drawer renders outside the page wrapper.
- "এই পাঠে": the lesson's blocks with the author's `###` sections nested under them, numbered like the blocks, and prev/next. The current entry (`aria-current="location"`) follows the scroll position; a link into the closed deep dive opens it first.
- The reader's done/total counts and the progress card arrive with reader progress.

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
- The reader's state per lesson, "এখন পড়ছ" and the progress card arrive with reader progress.

## Contents page

`/contents`: the whole curriculum, tracks → topics → groups → lessons, in reading order.

- Header: title, intro and computed stats (tracks, topics, lessons).
- Toolbar (client island, `contents-controls.tsx`): a search field and "সব খোলো / সব বন্ধ করো". Search matches every word of the query against a lesson's title, its group and its topic (`matchesQuery` in `packages/content/src/search.ts`). Matching lessons stay visible with their groups, topics and tracks, all opened; the count is announced in a status line. Clearing the search restores what was open before. The query lives in `?q=` (conventions §10): written with `history.replaceState` as the reader types (no history entry per keystroke), applied on load, removed when cleared. Pages with URL state read it with `useUrlParam` (a `useSyncExternalStore` hook: "" on the server and during hydration, the URL's value on the client, updated by `writeUrlParams` and back/forward) and change it with `writeUrlParams`, both in `apps/web/lib/url-state.ts`. The URL is the only copy of that state: counts are derived from data passed as props, and effects keyed on the values only update the DOM. No `requestAnimationFrame` for state or focus: it never fires in a page that is not being rendered (a background tab, a hidden pane). A link to a `#section` on another page whose look depends on `:target` (the glossary card, the privacy section) is a plain `<a>`: `next/link` changes the hash with `pushState`, which scrolls but does not update `:target`. `useUrlParam` hears `popstate` and `writeUrlParams`, not Next's own `pushState`: a control that changes only the query on the same page calls `writeUrlParams` rather than rendering a `<Link>` (links into these pages from other pages are fine, since the page mounts with the new URL).
- The list is server-rendered native `<details>`, so it works without JS. The first track starts open, the rest closed; groups start closed. The island only sets `hidden` and `open`.
- Each track: number badge, name (the `h2`), subtitle with topic and lesson counts, then its topics on a line in the track colour: topic link (`h3`), position, lesson count, an interchange chip, then its groups (`h4` in a `<details>`) or lessons. A topic whose home is another track shows "পাঠগুলো {track} লাইনে →" instead of lessons, linking to `#track-{id}`.
- Lesson numbers are track.topic.lesson (`৪.৪.৩`), `aria-hidden`, and hidden below `sm`.
- "লাইনে যাও" (from `lg`): plain `<a href="#track-…">` links, so `hashchange` fires and the island opens the target track. In-page links that must open a `<details>` use `<a>`, not `next/link`, which changes the hash without that event.
- The reader's progress (status filters, done counts, "এখন পড়ছ", "এখানে থেমেছিলে") arrives with reader progress.

## Roadmap page

`/roadmap`: every track and topic as a metro-style map, drawn from `content/map.json` (D-35).

- Data: `buildRoadmap(graph)` in `packages/content/src/roadmap.ts` gives the canvas size, track lines and each topic's position, flags and lesson tree; `isTopicVisible` (track focus, start-only, search) and `topicNeighbours` are tested there.
- Drawing (`roadmap-canvas.tsx`, hook-free so Home can reuse it as a static preview): SVG polylines in the track colour, a label per topic placed by `map.json`'s `label`, "শুরু এখান থেকে" flags on start topics, and a button per topic (interchanges have a larger dot with a dark ring). Positions come from data, so they are inline `left`/`top`/size styles; colours and look stay in classes. Topics are in track order, which is the keyboard order.
- Each topic's hit area counter-scales with the zoom, so it stays 44px on screen at 50–120 %.
- Island (`roadmap-explorer.tsx`): track focus (legend column from `md`, a chip row below it), "সব / শুরুর স্টেশন", topic search, zoom (−/+, 50–120 %, opens at 80 %), and the topic panel. Filtering dims topics and lines (`opacity-15`); a status line announces the count. State lives in the URL: `?topic=&track=&q=&filter=start`, through `lib/url-state.ts`; a shared link opens with the topic's panel and the map centred on it.
- Topic panel (`roadmap-panel.tsx`): track chips, kicker (line, position), name, description, lessons and reading time, "শুরু করো" to the first lesson and the topic page, the lessons (groups as `<details>`, the first open), the interchange note, the home track's topics (select another) and previous/next. Beside the map from `md`, where picking a topic moves focus to the panel's heading and Escape closes it and returns focus to the dot; a bottom sheet below `md`.
- Planned topics (no published lesson) are on the map, muted, with "পরিকল্পনায় আছে" and no start or topic-page link.
- Links in: the breadcrumbs' "রোডম্যাপ" and track (`/roadmap?track=…`), the header and footer, and the not-found page.
- Status filters, progress bars and bookmarks arrive with reader progress.

## Glossary page

`/glossary`: every term in this build, A–Z.

- Header: title, intro and a sample of the dotted underline that marks a `<Term>` in lessons.
- Controls (client island, `glossary-controls.tsx`): a search field (term, Bangla name and the definition's prose; code examples are left out, `glossarySearchText`) with a count, and an A–Z bar ("সব" plus a button per letter, disabled when no term starts with it; "#" appears only for terms not starting with A–Z). Search and letter combine; the result count is announced; with no match, a card offers "সব পরিভাষা দেখাও". State lives in `?q=&letter=` (`lib/url-state.ts`).
- Terms are server-rendered cards in letter sections (`term-card.tsx`): term (`lang="en"`), Bangla name, track chip, the definition with its code example (the same components as the popover, `definition-components.tsx`), and "যে পাঠে আছে": each lesson as track › topic › group › lesson (the `›` is hidden from screen readers and read as a comma).
- A card's id is the term id, so the Term popover's "পরিভাষায় দেখো →" link (`/glossary#<id>`) lands on it; `:target` outlines it.
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
- The resume card ("যেখানে থেমেছিলে") arrives with reader progress.

## Dashboard page

`/dashboard` in its first-visit state (D-32, D-40): title, subtitle, a "এখনো কিছু সেভ হয়নি" chip, and an empty-state card (a line with only the first station reached, a welcome, and what will collect here). "প্রথম পাঠ শুরু করো" goes to the same lesson as Home's "শুরু করো" (`homeStartLesson`) and is left out while nothing is published, when "রোডম্যাপ দেখো" becomes the main button. Progress, quiz results, bookmarks, the reading heatmap and export/import (with the empty state's import link) arrive with reader progress.

## About page

`/about` (no design reference; laid out like the other text pages, `max-w-3xl`): the H1, lead and "হালনাগাদ" date from `content/pages/about.mdx`, the author block (Home's `AuthorCard`), then the MDX prose (`about-components.tsx`), where `<Privacy>` renders the `#privacy` card the footer links to. The footer's "সাইট" column shows "সম্পর্কে" (`/about`) and "প্রাইভেসি" (`/about#privacy`) only when the build shows the page (ADR-0012).

## shadcn customisations

Generated shadcn components (`packages/ui/src/components/`) are added with the CLI and not edited, except for the changes listed here. Re-apply them whenever a component is regenerated.

| Component    | Change                                                                                                                                                                                                  | Why                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button.tsx` | Outline variant: `bg-card` fill and `hover:bg-muted` instead of `bg-input/30` / `hover:bg-input/50`.                                                                                                    | `--input` is darker than the design's line2 (3:1 control edges), so the generated fill turned grey; the design's outline buttons are white with a thin border. |
| `button.tsx` | Size map: `default` `h-11 px-5`, `lg` `h-12 px-6`, `icon` `size-11`, `icon-lg` `size-12`; `xs`, `sm`, `icon-xs` and `icon-sm` keep their size on a mouse and grow to 44px on touch (`pointer-coarse:`). | 44px touch targets ([Accessibility](#accessibility), [ADR-0008](decisions/ADR-0008-design-tokens.md)).                                                         |

Used as generated, with these notes:

- `sheet.tsx`: its built-in close button has an English "Close" label and its overlay uses `bg-black/80` (kept: a scrim carries no text). Every sheet uses `AppSheetContent` (`apps/web/components/app-sheet.tsx`) instead of `SheetContent`: it turns the built-in button off, adds a close button labelled through `t()`, and turns the slide off for reduced motion. The overlay fade is turned off for reduced motion in `globals.css`, since the wrapper cannot reach it.
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
