# Product spec

**What CodePoth is, which pages it has, how reader progress is stored and which stack builds it.**

CodePoth (কোডপথ) is a free, public, reader-first Bangla learning site that takes a reader from zero to a complete full-stack developer. The author (G. M. Nazmul Hussain, an experienced developer) uses it as his own structured learning book, but every page is written for a public reader starting from zero.

- Live URL (planned): https://codepoth.nazmulhussain.com
- UI language: Bangla. Technical terms stay in English (React, useEffect, Docker…). Numbers in UI use Bangla digits.
- Design reference: the design handoff (pages Home, Map, Topic, Lesson, Contents, Dashboard, Glossary), kept locally in `reference/handoff/` and not committed. See [design.md](design.md).

## Principles

- Reader-first public site. No author journey, no dev diary, no first-person "I made this mistake" tone.
- No login and no backend in v1. Content lives as MDX in this repo.
- The roadmap is drawn as a metro-style map (colored lines, dots, interchanges). This is a visual style only; code uses neutral names (see [content-model.md](content-model.md)).

## Pages (v1)

Home · Map (roadmap) · Contents (all lessons) · Topic · Lesson · Glossary · Dashboard (reader progress) · About · 404.

Header search opens Pagefind (⌘K).

URLs: `/learn/[track]/[topic]` and `/learn/[track]/[topic]/[lesson]` (no group in the URL), plus `/roadmap`, `/contents`, `/glossary`, `/dashboard`, `/about` ([ADR-0006](decisions/ADR-0006-urls-and-content-keys.md)).

Footer links stay inside the v1 pages: author → the author block on Home (`/#author`), what's new → `/#new`, privacy → a privacy section on About (`/about#privacy`). GitHub and LinkedIn links render only when they are set in `site.ts`.

## Reader progress (client only)

- Progress, bookmarks and quiz scores belong to the READER and live in the browser (localStorage).
- localStorage key `codepoth:v1`, validated with Zod on every read. Shape and rules: [ADR-0007](decisions/ADR-0007-reader-progress-shape.md).

  ```ts
  {
    lessons: { [id]: { openedAt, doneAt?, quiz?: { score, total, at } } },
    bookmarks: { [id]: { at } },
    lastRead?: { id, at, anchor? },
    activity: { ["YYYY-MM-DD"]: lessonId[] } // last 140 days
  }
  ```

- Keys are lesson stable IDs (see [content-model.md](content-model.md#stable-ids)).
- Lesson states: done (`doneAt` present) / in progress (entry without `doneAt`) / not started (no entry). Topic, group and track states are derived from their lessons.
- Dashboard ("আমার অগ্রগতি"/"ড্যাশবোর্ড") supports export to JSON, import (merge or replace) and clear-all with confirmation.
- Never send progress anywhere. Footer says: কোনো ট্র্যাকিং নেই · অগ্রগতি শুধু তোমার ব্রাউজারে.

## Config

- `packages/config/src/site.ts`: site name (Bangla + English), logo component/path, domain, author links (optional; a link without a value is not rendered). Also selects the active label set.
- `packages/config/src/labels/*.json`: every UI string (nav, buttons, statuses, block titles, level names). Components read labels through one helper, e.g. `t("nav.roadmap")`. No Bangla UI string is hardcoded inside a component.
- Label variants: `bn-metro.json` (লাইন/স্টেশন), `bn-path.json` (পথ/ধাপ). Both have exactly the same keys and placeholders; a test enforces it, and a set with a missing key also fails typecheck.
- `t(key, values?)` (`packages/config/src/t.ts`): keys are typed from `bn-metro.json`; `{name}` placeholders are filled from `values`, numbers are shown with Bangla digits, and a placeholder without a value throws.
- Format helpers (`packages/config/src/format.ts`): `formatNumber` and `formatDate` use `Intl` with the `bn-BD` locale (Bangla digits and month names, e.g. "১১ নভেম্বর, ২০২৬"). Date-only content dates are formatted in UTC.

## Tech stack

- Next.js (App Router) + TypeScript. Every route is pre-rendered at build time on Vercel; no `output: 'export'` ([ADR-0004](decisions/ADR-0004-vercel-ssg-not-static-export.md)).
- Tailwind CSS + shadcn/ui (in `packages/ui`). Dark mode via next-themes.
- Zod for schemas (frontmatter, `_meta.json`, labels, localStorage data).
- Testing: Vitest (unit), Playwright (E2E).
- MDX compiled at build time with Content Collections as the typed content layer ([ADR-0005](decisions/ADR-0005-content-layer.md)).
- Shiki for code highlighting. Pagefind for static search. Giscus for comments (later).
- pnpm + Turborepo. Deploy on Vercel (Root Directory `apps/web`). Git + GitHub.

## Roadmap (not now)

- Apps, each created with its official CLI: `apps/api` (Hono), `apps/ai` (FastAPI via uv), `apps/mobile` (Expo).
- PostgreSQL + Drizzle + Better Auth for accounts/sync.
- FastAPI + pgvector for an AI tutor over our own lessons.
