# Product spec

**What CodePoth is, which pages it has, how reader progress is stored and which stack builds it.**

CodePoth (কোডপথ) is a free, public, reader-first Bangla learning site that takes a reader from zero to a complete full-stack developer. The author (Nazmul Hussain, an experienced developer) uses it as his own structured learning book, but every page is written for a public reader starting from zero.

- Live URL (planned): https://codepoth.nazmulhussain.com
- UI language: Bangla. Technical terms stay in English (React, useEffect, Docker…). Numbers in UI use Bangla digits.
- Design reference: the "কোডপথ" Claude Design artifact, pages `* v3` (Home, Map, Topic, Lesson, Contents, Dashboard, Glossary). v1/v2 are outdated. See [design.md](design.md).

## Principles

- Reader-first public site. No author journey, no dev diary, no first-person "I made this mistake" tone.
- No login and no backend in v1. Content lives as MDX in this repo.
- The roadmap is drawn as a metro-style map (colored lines, dots, interchanges). This is a visual style only; code uses neutral names (see [content-model.md](content-model.md)).

## Pages (v1)

Home · Map (roadmap) · Contents (all lessons) · Topic · Lesson · Glossary · Dashboard (reader progress) · About · 404.

Header search opens Pagefind (⌘K).

## Reader progress (client only)

- Progress, bookmarks and quiz scores belong to the READER and live in the browser (localStorage).
- localStorage key `codepoth:v1`. Shape (validated with Zod):

  ```ts
  {
    lessons: { [id]: { done, doneAt, quiz?: { score, total, at } } },
    bookmarks: string[],
    lastRead: { id, at, anchor? }
  }
  ```

- Keys are lesson stable IDs (see [content-model.md](content-model.md#stable-ids)).
- Lesson states: done / in progress (opened, not done) / not started.
- Dashboard ("আমার অগ্রগতি"/"ড্যাশবোর্ড") supports export to JSON, import, and clear-all with confirmation.
- Never send progress anywhere. Footer says: কোনো ট্র্যাকিং নেই · অগ্রগতি শুধু তোমার ব্রাউজারে.

## Config

- `packages/config/src/site.ts`: site name (Bangla + English), logo component/path, domain, author links. Also selects the active label set.
- `packages/config/src/labels/*.json`: every UI string (nav, buttons, statuses, block titles, level names). Components read labels through one helper, e.g. `t("nav.roadmap")`. No Bangla UI string is hardcoded inside a component.
- Label variants: `bn-metro.json` (লাইন/স্টেশন), `bn-path.json` (পথ/ধাপ).

## Tech stack

- Next.js (App Router) + TypeScript. Every route is pre-rendered at build time on Vercel; no `output: 'export'` ([ADR-0004](decisions/ADR-0004-vercel-ssg-not-static-export.md)).
- Tailwind CSS + shadcn/ui (in `packages/ui`). Dark mode via next-themes.
- Zod for schemas (frontmatter, `_meta.json`, labels, localStorage data).
- Testing: Vitest (unit), Playwright (E2E).
- MDX compiled at build time with a typed content layer (Velite or Content Collections — to be decided, record as an ADR in [decisions/](decisions/)).
- Shiki for code highlighting. Pagefind for static search. Giscus for comments (later).
- pnpm + Turborepo. Deploy on Vercel (Root Directory `apps/web`). Git + GitHub.

## Roadmap (not now)

- Apps, each created with its official CLI: `apps/api` (Hono), `apps/ai` (FastAPI via uv), `apps/mobile` (Expo).
- PostgreSQL + Drizzle + Better Auth for accounts/sync.
- FastAPI + pgvector for an AI tutor over our own lessons.
