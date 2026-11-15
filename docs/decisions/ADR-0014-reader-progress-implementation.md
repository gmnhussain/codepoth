# ADR-0014: How reader progress is built in the web app

- Status: accepted
- Date: 2026-11-15
- Details: [ADR-0007](ADR-0007-reader-progress-shape.md) (the stored shape and its rules), [ADR-0001](ADR-0001-reader-first-no-backend.md) (nothing leaves the browser), [performance.md](../development/performance.md) (hydration, CLS), [conventions §10 and §14](../development/conventions.md#10-frontend)

## Context

ADR-0007 fixes what `codepoth:v1` stores and the rules for it, but not where the code lives, how pages read it without a hydration mismatch or layout shift, or how import, dialogs and the heatmap work. Every page from Phase 2 was built in its first-visit state, with nothing that depends on the reader; Phase 3 adds the reader's progress to all of them, so these choices are shared by every later commit.

## Decision

- **Progress logic is app code, not a package.** The Zod schema, the operations (open, mark and unmark done, bookmark toggle, quiz attempt, activity with the 140-day pruning), import merge, the export/import file format and the selectors (lesson, group, topic, track and overall state, next unfinished lesson, weakest quizzes, activity by day) live in `apps/web/lib/progress/` as pure, framework-free functions. Selectors take plain id lists, never the content graph. `packages/content` owns content, not reader state (conventions §5), and no second consumer exists. `apps/web` gets Vitest (catalog version) with its own `vitest.config.ts` and `test` script, and joins the Turborepo `test` task.
- **One browser store.** `apps/web/lib/progress-store.client.ts` reads, validates and writes `localStorage` behind try/catch and a `typeof window` guard. `useProgress()` uses `useSyncExternalStore`:
  - the server snapshot is one shared empty-progress constant, so prerendered HTML is the first-visit state for every reader;
  - `getSnapshot` returns the same cached object until the data changes: the store keeps the parsed value and replaces it only on its own write or on a `storage` event from another tab;
  - every write goes through the pure operations; a failed write (quota, private mode, storage disabled) leaves the page working and the in-memory value unchanged.
- **Zod is loaded lazily, as `zod/mini`.** Measured on a lesson page, full Zod in the store added 31.6 KB gzip to First Load JS and `zod/mini` still 17.2 KB, on every page that shows progress. So the browser schemas use `zod/mini`, the lesson id rule comes from a Zod-free pattern (`@workspace/content/patterns`), and the store loads the schema module with `import()` in its own chunk:
  - loading starts when the store gets its first subscriber, right after hydration, not on the first write;
  - until it arrives, every read returns the empty-progress constant, the same object as the server snapshot;
  - writes made before it arrives wait for it and are applied in the order they were made, each on the value in storage at that moment;
  - a `storage` event from another tab during the load is not lost: the value is read from storage once the schema is there;
  - if the chunk fails to load, the page keeps working with empty progress, writes report failure and change nothing, and the next write tries the load again.
- **What counts as opening a lesson.** Once per page view, a hydrated lesson page records `openedAt` (first visit only), `lastRead` and today's activity. `lastRead.anchor` follows the lesson TOC's current section and is written debounced (about 1 s after the section stops changing, and once on `pagehide`), so scrolling past many sections writes once. The first section of each page view is never saved: it is where the page opened (usually the top), so a quick visit from the sidebar or a link keeps the anchor where the reader actually stopped. An anchor is saved only after the section has changed at least once; `lastRead` itself still moves to the lesson on open.
- **No layout shift.** Progress appears after hydration, so it never pushes content down. Elements that exist in the first-visit HTML change state in place (labels, icons, counts with reserved width, filters). New blocks go only where nothing follows them on first paint or into a slot of the same size. Home's resume card reuses the hero's first-lesson line and its start button ("চালিয়ে যাও") instead of inserting a section. CLS is measured with Lighthouse on seeded progress.
- **Islands get ids, not the graph.** Each page passes its islands only the ids they need (a topic page: its lesson ids by group); states are computed in the browser with the shared selectors. An existing island (Contents and Glossary controls, the roadmap explorer, the lesson TOC) takes the job before a new one is added.
- **Dialogs and messages.** shadcn `alert-dialog` (clear all) and `dialog` (import: merge or replace), added through the CLI. Results appear in a message bubble fixed at the bottom of the screen with a close button, so a message never moves the page; an always-present, visually hidden `role="status"` region announces each one. No toast library.
- **Import limits.** An import file over 1 MB is refused on `File.size` before it is read. The whole file is validated with Zod; too large, not JSON, wrong `format`, unsupported `version` and invalid data each get their own message, and none of them touches the current progress.
- **Heatmap.** An SVG grid of 20 weeks × 7 days drawn in the Dashboard island from `activity`, in the token shades from [design.md](../design.md), with every day's count also available as text (an accessible table alternative) and Bangla dates from the format helpers.
- **Lesson data for Home and the Dashboard.** Both need data on lessons the page cannot know in advance (the last-read lesson can be any of them), and they get it in two ways:
  - **Home fetches `/lessons.json`**, a route handler prerendered at build (`dynamic = "force-static"`) from the same content graph as the pages, so drafts follow the same rule. It holds each lesson's title, URL and scope (group, or topic), and each scope's title and lesson ids. Home requests it only when a last read exists, after hydration; a failed request, a response that fails the shape check, or a missing lesson keep the first-visit view. Most Home visits are first visits, which pay nothing; a returning reader downloads 6.5 KB gzip (170 lessons). Inlining the same data had added 8.2 KB gzip to every Home page.
  - **The Dashboard inlines its data** in the page. Its visitors are readers with progress, who need the data on every visit, and its rows show each lesson's "track · topic › group" path, which `/lessons.json` does not carry. It reuses the same index builder (`resumeIndexOf`) and adds the path, the tracks, the topics and a trimmed map: the page's HTML grows from 7.6 to 18.5 KB gzip with 170 lessons, and no request or loading state is needed after the store is ready.

## Alternatives considered

- **Progress logic in `packages/content` or a new package.** Rejected: reader state is not content, and a new package waits for a second consumer (CLAUDE.md).
- **Read storage in `useEffect` + `useState` per component.** Rejected: each island parses on its own, tabs do not sync, and it invites a first render that differs from the server.
- **Parse storage inside `getSnapshot`.** Rejected: a new object on every call makes `useSyncExternalStore` re-render in a loop.
- **Zod in the First Load JS** (full or `zod/mini`). Rejected: 31.6 or 17.2 KB gzip on every page that shows progress, for a check that can wait until after hydration.
- **Hand-written checks instead of Zod in the browser.** Rejected: ADR-0007 and conventions §7 validate stored and imported progress with Zod, and with lazy loading the store and the lesson recorder together add 1.0 KB gzip to a lesson page's First Load JS (196.6 → 197.6 KB), with Zod in a 16.6 KB gzip chunk that loads after hydration.
- **Write `lastRead.anchor` on every section change.** Rejected: fast scrolling writes once per section crossed.
- **Pass the whole content graph to islands.** Rejected: it ships the graph to every page that shows a count.
- **A toast library for results.** Rejected: a dependency for two messages, and the design shows them inline.
- **A chart library for the heatmap.** Rejected: a dependency for 140 cells; an SVG grid draws the same thing with no extra JavaScript.
- **Inline the lesson index on Home.** Rejected: 8.2 KB gzip on every Home page, for data only returning readers use.
- **Fetch `/lessons.json` on the Dashboard too.** Rejected: its visitors need the data every time, the rows need the track · topic › group path, and a fetch would add a request and a loading state after the store is ready.

## Consequences

- The rules from ADR-0007 are unit-tested in `apps/web` without a browser; `pnpm test` covers them.
- Pages stay statically generated and identical for every reader; progress is a client-side overlay, so no route becomes dynamic.
- Islands that show progress take id props, so a page's First Load JS grows only by the store and selectors, not by content data. Zod arrives in a separate chunk after hydration.
- Progress shows up one small chunk load after hydration rather than at hydration; it is client-only either way, so the server HTML and CLS are unaffected.
- A new progress feature adds a pure operation or selector with tests first, then uses it through `useProgress()`.
