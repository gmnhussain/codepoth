@AGENTS.md

# CodePoth (কোডপথ)

A free, public, reader-first Bangla learning site that takes a reader from zero to a complete full-stack developer. Static Next.js site, MDX content in this repo, no login or backend in v1; reader progress lives only in the browser.

## Docs (read the relevant one before working in that area)

- [docs/spec.md](docs/spec.md): product, pages, reader progress (localStorage), config/labels, tech stack, roadmap
- [docs/content-model.md](docs/content-model.md): content hierarchy, `_meta.json`, stable IDs, frontmatter, lesson template. Read before touching `content/` or `packages/content`
- [docs/design.md](docs/design.md): design tokens, fonts, track colors, a11y. Read before UI work
- [docs/writing-guide.md](docs/writing-guide.md): rules for writing lesson content
- [docs/development/conventions.md](docs/development/conventions.md): engineering conventions (git, TypeScript, naming, frontend, a11y, testing, CI). Read before writing code
- [docs/development/performance.md](docs/development/performance.md): rendering, fonts, lazy loading, Core Web Vitals targets. Read before UI work
- [docs/decisions/](docs/decisions/): ADRs and open questions

## Repository

Turborepo + pnpm workspaces, created from the shadcn monorepo template.

```
apps/web/                    # Next.js site (App Router, SSG)
packages/ui/                 # shadcn/ui components + Tailwind theme
packages/eslint-config/      # shared ESLint flat configs
packages/typescript-config/  # shared tsconfig bases
packages/content/            # content schemas, loader (Content Collections), validation, graph
packages/config/             # site config, labels + t(), format helpers, track hue list
content/                     # MDX content, plain files at the root
docs/                        # spec, design, decisions, development
```

Design tokens (colours, track hues, type scale) live in `packages/ui/src/styles/globals.css` ([ADR-0008](docs/decisions/ADR-0008-design-tokens.md)).

## Hard rules

- Code uses neutral names: track / topic / group / lesson / section. Display terms, site name and logo are pending and come from `packages/config`. Do not hardcode them.
- No hardcoded lists of tracks/topics/lessons. The folder structure is the source of truth.
- No Bangla UI string inside a component. Use `t("…")` with label keys.
- Never change an existing lesson `id` (reader progress depends on it) without asking.
- Never send reader progress anywhere. No tracking or analytics.
- Do not create a new package until a second consumer needs it (`content` and `config` are the exceptions).
- New apps (`api`, `ai`, `mobile`) are created with their official CLI, and only when asked.

## Working rules

- Use plan mode for anything touching more than a couple of files; show the plan before editing.
- Small steps. After each step run lint, typecheck and build, then propose a Conventional Commits message.
- Ask before adding a dependency, changing the content model, or changing a lesson `id`.
- Do not write lesson content unless asked; when asked, follow the lesson template and the writing guide.
- When a decision is made or changes, add/supersede an ADR in `docs/decisions/` and update the affected doc. Keep this file short; details belong in `docs/`.

## Commands

Run from the repo root.

- `pnpm dev`: run all apps in dev mode
- `pnpm build`: build everything
- `CONTENT_INCLUDE_DRAFTS=0 pnpm build`: the real no-drafts (production content) build. Use this to check a build without drafts: a local `apps/web/.env.local` may set `CONTENT_INCLUDE_DRAFTS=1`, so a plain `pnpm build` can silently include drafts (an explicitly set variable wins over `.env.local`)
- `pnpm lint`: lint
- `pnpm typecheck`: typecheck
- `pnpm format`: format every file with Prettier
- `pnpm format:check`: check formatting without writing
- Add a shadcn component: `pnpm dlx shadcn@latest add <name> -c apps/web`
- `pnpm test:commit-msg`: test the commit message rules
- `pnpm test`: run every package's Vitest tests (unit, label sets, theme contrast, content validation)
- End-to-end tests: to be added
