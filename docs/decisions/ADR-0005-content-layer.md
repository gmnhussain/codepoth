# ADR-0005: Content Collections as the content layer

- Status: accepted
- Date: 2026-11-14

## Context

MDX content, `_meta.json` files, glossary entries and `map.json` have to be read, validated with Zod and turned into typed data at build time ([content-model](../content-model.md)). The spec left the choice between Velite and Content Collections open. The site runs on Next.js 16, where `next build` uses Turbopack by default, and the Zod schemas in `packages/content` are the single source of truth for every content shape.

Evidence, checked on 2026-11-14 (npm registry, GitHub API):

|                        | Velite                                                                                                                                                                                                                                                                                  | Content Collections                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latest release         | 0.4.0 (2026-06-17), 1.0.0-alpha.3 (2026-06-19)                                                                                                                                                                                                                                          | `@content-collections/core` 0.15.3 (2026-09-21); releases in Mar, Apr, May, Jun and Sep 2026                                                                                                        |
| Next.js integration    | Webpack plugin, or `build()` called from `next.config`                                                                                                                                                                                                                                  | `@content-collections/next` 0.2.11, peer `next ^12 … ^16`                                                                                                                                           |
| Next.js 16 / Turbopack | The webpack plugin does not run under Turbopack. [Issue #408](https://github.com/zce/velite/issues/408) (2026-09-09, open): the documented `next.config` integration races with the Turbopack production build. Workaround: run `velite build` as a separate step and a watcher in dev. | Runs from `next.config`, independent of the bundler. [The adapter](https://github.com/sdorra/content-collections/blob/main/packages/next/src/index.ts) handles Next.js 16's dev process explicitly. |
| Schemas                | Its own bundled schema builder (`s`)                                                                                                                                                                                                                                                    | Standard Schema, so Zod 4 schemas are used as they are                                                                                                                                              |
| Activity               | Last commit 2026-08-03, 34 open issues, one maintainer                                                                                                                                                                                                                                  | Last commit 2026-09-21, 58 open issues                                                                                                                                                              |

## Decision

- Use Content Collections (`@content-collections/core`, `@content-collections/next`, `@content-collections/cli`).
- The collections and their config live in `packages/content`, which owns content loading. They use the Zod schemas from the same package directly.
- Generation runs as its own Turborepo task before `typecheck`, `lint`, `test` and `build`, because those need the generated types. In `next dev` the Next.js adapter runs and watches the content.
- MDX is compiled inside the collection transform with `@mdx-js/mdx` and remark/rehype plugins (decided in detail when the lesson page is built). `@content-collections/mdx` is not used: its last release is from 2025-03 and it is built on `mdx-bundler`.

## Alternatives considered

- **Velite.** Rejected: its Next.js integration is broken under Turbopack (the default bundler), 1.0 is still alpha, and its own schema builder would duplicate the Zod schemas.
- **A hand-written loader** (Zod + a frontmatter parser + `@mdx-js/mdx`). Possible, but it re-implements file watching, caching and type generation that Content Collections already provides. Kept as the fallback if Content Collections stops being maintained.

## Consequences

- One schema per shape: the Zod schema in `packages/content` validates content and gives its TypeScript type.
- The build has an explicit generate step. Turborepo inputs must include the root `content/` folder, or a content change replays a stale cached result.
- The project depends on a 0.x library with a single main maintainer. The loader is small and isolated in `packages/content`, so replacing it touches one package.
