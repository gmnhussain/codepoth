# ADR-0015: Site search with Pagefind

- Status: accepted
- Date: 2026-11-15

## Context

The header's search opens Pagefind ([spec](../spec.md#pages-v1)). [ADR-0004](ADR-0004-vercel-ssg-not-static-export.md) chose Next.js's default build on Vercel over `output: 'export'` and left one thing open: Pagefind runs over the pre-rendered HTML, but how was to be settled when search was built. Without static export there is no `out/` folder of HTML to point Pagefind at, and Next.js names its files differently from the URLs it serves.

The site's text is Bangla with English technical terms (React, useEffect), so how Pagefind splits and matches Bangla words had to be checked, not assumed.

## Decision

### Which HTML, when, and where it is served from

- `next build` writes every pre-rendered page to `apps/web/.next/server/app/<route>.html` (`/` is `index.html`).
- `apps/web/scripts/build-search-index.ts` builds the index right after `next build`: the app's `build` script is `next build && node scripts/build-search-index.ts` (Node runs the TypeScript file directly). It is not a `postbuild` script, because pnpm does not run pre/post scripts by default.
- The script reads `.next/prerender-manifest.json` and takes only that build's page routes with HTML (`routeType: "page"`, `htmlSize > 0`). It never globs the folder, so no page left from an earlier build reaches the index.
- It indexes each file through Pagefind's Node API with an explicit URL (`addHTMLFile({ url: route, content })`). The CLI would derive `/about.html` from `about.html`, a URL Next.js does not serve.
- The bundle is written to `apps/web/public/pagefind/` (cleared first, ignored by git) and served from `/pagefind/` like any `public` file (`Cache-Control: public, max-age=0`; Pagefind's index and fragment file names are content hashes). `turbo.json` lists `public/pagefind/**` among the `build` outputs, so a cached build restores the index too.
- The build fails if no page was indexed, which catches a lost marker.
- Pagefind is `pagefind@1.5.2`, an exact dev dependency of `apps/web`.

### What is indexed

- Only content is indexed: lessons, topics, glossary terms and About. A page's content is marked with `data-pagefind-body`; Pagefind skips every page without the marker (Home, Map, Contents, Dashboard, 404) and everything outside it (header, footer, navigation).
- Lesson: the title, the description and the lesson body. Breadcrumbs, chips, the updated line with its toggles, the TOC bar and the previous/next section are marked `data-pagefind-ignore="all"`.
- Topic: the title and description only. Each lesson is its own result, so the topic does not repeat its lessons' titles.
- Glossary: each term is a sub-result of the glossary page, linking to `/glossary#<id>`. Pagefind 1.5 makes sub-results from headings with an id, so the term's `h3` carries the term id. The card is outlined with `has-[:target]`, and the letter headings are ignored. The "used in" lesson list is ignored. With no published term, the glossary page has no marked content and is not indexed.
- About: the whole page except its updated date.
- Elements with `aria-hidden="true"` are left out of every page (`excludeSelectors`): section numbers, avatar initials, separators and the copy button's text are decoration for assistive technology, and are not words to search for. Without this, `০১` and `ধারণা` were indexed as one word. Step numbers ("ধাপ ১") are ignored the same way.
- Each page carries its result details as Pagefind metadata in hidden elements outside the indexed content (`components/search/search-meta-tags.tsx`): `kind` (lesson, topic, glossary, page), `track`, `topic` and the track's colour (`hue`).

### Drafts

The index holds exactly the pages the build rendered. A build without drafts (`CONTENT_INCLUDE_DRAFTS=0`) renders no draft, so none is indexed. Measured on 2026-11-15, while every lesson and term is a draft: 1 of 8 page routes indexed (About), and `useEffect` and `React` find nothing. A build with drafts indexes the drafts too; such a build is `noindex` and never production ([conventions §12](../development/conventions.md#12-public-site-and-seo)). Measured: 230 of 236 page routes.

### Bangla

- `<html lang="bn">` gives one `bn` index. Pagefind has no Bengali stemmer, so it builds the index without stemming; words are split on spaces and punctuation, and hyphenated words such as `API-তে` are split into their parts as well.
- The page text and the query are normalised the same way (`lib/search/search-text.ts`): Unicode NFC, and zero-width joiners removed. Many keyboards type the "র + য-ফলা" conjunct with a joiner; content is written without it. Measured before the change: `ট্র‍্যাকিং` with a joiner found a different page than `ট্র্যাকিং`.
- English terms in Bangla pages match in any case (`React`, `react`, `REACT`: 17 results each). Pagefind also splits camelCase: `useEffect` and `useeffect` both find the useEffect lesson first, and also pages that contain both "use" and "effect".
- The last query word matches as a prefix (`প্রাইভে`, `অগ্রগ` find About).
- Suffixed forms (measured on the drafts build, results compared with the base word's):

| Base (results) | -এর / -ের   | -কে         | -ে / -তে   | -গুলো         |
| -------------- | ----------- | ----------- | ---------- | ------------- |
| ফাংশন (5)      | ফাংশনের 1   | ফাংশনকে 4   | ফাংশনে 5   | ফাংশনগুলো 4   |
| সার্ভার (7)    | সার্ভারের 1 | সার্ভারকে 6 | সার্ভারে 7 | সার্ভারগুলো 6 |
| কোড (11)       | কোডের 5     | কোডকে 7     | কোডে 11    | কোডগুলো 7     |
| কাজ (17)       | কাজের 3     | কাজকে 1     | কাজে 17    | কাজগুলো 1     |
| শুরু (4)       | —           | —           | শুরুতে 1   | —             |
| ভাষা (4)       | —           | —           | ভাষাতে 1   | —             |

As a word before another word, the possessive misses entirely: `ফাংশনের return` 0 (base 2), `সার্ভারের request` 0 (base 3), `কাজের বাইরের` 0 (base 4). A suffixed form that appears somewhere in the content matches only the pages with that exact form. Pagefind's other matches above come from a fallback whose rule this test did not pin down. The possessive is the most common suffix in the lessons, so these misses are common.

The dialog therefore trims these endings from the query (`lib/search/trim-suffixes.ts`): `-গুলো`, `-দের`, `-এর`, `-ের`, `-কে`, `-তে`, longest first, and any of them after a hyphen on an English word (`state-এর`, `API-তে`). A stem keeps at least two Bangla letters, so a word that only ends in the same letters stays whole (`থেকে`, `দিতে`); when the longest ending leaves too short a stem, a shorter one is tried (`চাঁদের` → `চাঁদ`). The trimmed query does not replace the reader's: both run, the reader's own results come first and the trimmed query only adds pages it did not find (`mergeResults`). A trim can be wrong (`বাইরের` → `বাইর`, `করতে` → `কর`), and replacing the query would then lose what the reader's spelling finds; adding never does.

Measured again through the dialog on the drafts build (rows shown, at most 10, and how many of the base word's rows each form also shows):

| Base (rows) | -এর / -ের         | -কে               | -ে / -তে         | -গুলো               |
| ----------- | ----------------- | ----------------- | ---------------- | ------------------- |
| ফাংশন (7)   | ফাংশনের 7 (7/7)   | ফাংশনকে 7 (7/7)   | ফাংশনে 7 (7/7)   | ফাংশনগুলো 7 (7/7)   |
| সার্ভার (8) | সার্ভারের 8 (8/8) | সার্ভারকে 8 (8/8) | সার্ভারে 8 (8/8) | সার্ভারগুলো 8 (8/8) |
| কোড (10)    | কোডের 10 (9/10)   | কোডকে 10 (10/10)  | কোডে 10 (10/10)  | কোডগুলো 10 (10/10)  |
| কাজ (10)    | কাজের 10 (8/10)   | কাজকে 10 (9/10)   | কাজে 10 (10/10)  | কাজগুলো 10 (9/10)   |
| শুরু (4)    | —                 | —                 | শুরুতে 4 (4/4)   | —                   |
| ভাষা (4)    | —                 | —                 | ভাষাতে 4 (4/4)   | —                   |

Before another word, every form now finds all of the base's rows: `ফাংশনের return` 5/5, `সার্ভারের request` 7/7, `কাজের বাইরের` 7/7, `return ফাংশনের` 5/5, `state-এর` 4/4. Where a form shows fewer than all of the base's rows, its own literal matches came first and the 10-row limit cut the rest. The rows count glossary terms one by one, so they differ from the page counts above.

### Results

- One row per page: a lesson, topic or About page is one row, however many of its sections matched (Pagefind 1.5 makes every heading with an id a sub-result, lesson sections included). Measured: `useEffect cleanup` matches 11 sections of the useEffect lesson and shows one row.
- The glossary page is the exception: each matching term is its own row, linking to `/glossary#<id>`, at most 5 per query, placed where the glossary page ranked.
- At most 10 rows; result data is fetched only for the pages that can become rows.
- A row shows the track's dot, the title, where it sits (track · topic) and its kind; terms have no track in the index and show a neutral dot.
- Known limit, ranking: `React` ranks the React Native lesson and topic above the React topic. It is not tuned now: nearly every lesson is still a short draft, and Pagefind's ranking depends on page length, so weights set today would be tuned to stubs. Revisit it once real lessons are published.

### What loads in the browser, and when

- With the page: only the header's search button, the ⌘K / Ctrl+K listener and the platform check for the shortcut box.
- After the page has loaded and is idle (`requestIdleCallback` after the `load` event, at most 2 s; a plain 2 s timer where it is missing), or earlier when the button is hovered or focused or search opens: the dialog's own chunk (3.9 KB gzip). Once it is here, the dialog is rendered closed, which renders and fetches nothing.
- When search opens: Pagefind (`pagefind.js`, its worker, the WASM and the index), never before, and never bundled.
- Opening runs as one synchronous update (`flushSync`) once the dialog's code is here, so the field exists and has focus before the next key event: a reader who types right after ⌘K or a click keeps every character. Keys are not held back and replayed, which would break Bangla input methods such as Avro.
- Measured on a fresh page view (cold cache), ⌘K or a click followed at once by "react": every character kept once the chunk has arrived, 50–140 ms after `load` on a fast connection and about 1.0–1.3 s after `load` on Slow 3G (400 ms latency). Opening before that still loses what is typed until the dialog appears; closing that window would mean putting the dialog's field in every page's First Load JS.

### Not verified

Whether Vercel's Next.js builder collects files written to `public/` after `next build` has finished. `next start` serves them locally, but no Next.js or Vercel document found says when the builder reads `public/`. On the first preview deploy, check the build log for the line `search index: N of M pages` and request `/pagefind/pagefind.js`. If the file is missing, the fallback is to build the records from content before `next build` (`addCustomRecord`), recorded in a new ADR that supersedes this part.

## Alternatives considered

- **The Pagefind CLI over `.next/server/app`:** it derives URLs from file names (`/about.html`), and it would also index HTML left from earlier builds.
- **`output: 'export'` for an `out/` folder:** rejected in ADR-0004 for headers, redirects and image optimisation.
- **Records built from the MDX source before the build:** the search would see source, not what the reader sees (rendered components, glossary popovers, quiz text), and it would duplicate rendering logic. Kept as the fallback for Vercel.
- **Pagefind 1.6, whose `data-pagefind-title` makes any element with an id a sub-result:** it was 14 days old when this was decided; moving the id to the term's heading gives the same result with 1.5.
- **Indexing whole pages including navigation:** every page would match every track and topic name in the header and menus.
- **Buffering keys typed before the dialog appears and replaying them into the field:** it breaks input methods that compose Bangla from several key presses (Avro and others).
- **The dialog in every page's First Load JS:** no wait at all on the first open, for about 4 KB gzip on every page; the idle prefetch leaves only the first moments after load.

## Consequences

- Search works on the deployed site only after a build; `next dev` has no index (the dialog says so).
- The index follows the content: no list of pages to keep in step, and drafts never reach a production index.
- Adding a new kind of content page means adding `data-pagefind-body` and `SearchMetaTags` to it; anything else on the page is left out by default.
- Elements marked `aria-hidden` are never searchable; text that must be found cannot be `aria-hidden`.
- Bangla has no stemming; a query word with a suffix finds fewer pages unless the dialog trims it.
- The index adds one step to every build (about a second for 230 pages).
