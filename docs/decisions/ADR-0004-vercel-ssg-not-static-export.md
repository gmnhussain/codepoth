# ADR-0004: Static generation on Vercel, not `output: 'export'`

- Status: accepted
- Date: 2026-11-14

## Context

Every page of the site can be built ahead of time, so the choice was between Next.js static export (`output: 'export'`, plain files that any host can serve) and Next.js's default build deployed on Vercel with every route pre-rendered.

Static export does not support `headers()`, `redirects()` or `next/image` optimisation with the default loader (see the Next.js static exports guide in `node_modules/next/dist/docs/`). The site needs all three: fixed security headers ([conventions](../development/conventions.md#13-security)), redirects for moved lessons ([content model](../content-model.md#stable-ids)) and optimised images. Static export would replace them with `vercel.json` headers and redirects and a custom image loader, which is more configuration for no benefit while the site is hosted on Vercel.

## Decision

- Use the default Next.js build on Vercel. No `output: 'export'`.
- Every route is pre-rendered: dynamic segments use `generateStaticParams` with `dynamicParams = false`, so no page is rendered on request.
- Security headers and lesson redirects are declared in `next.config.ts`.
- Pagefind runs as a post-build step over the pre-rendered HTML. The exact wiring is verified when search is implemented.

## Consequences

- `headers()`, `redirects()` and `next/image` work without workarounds.
- Pages are still static HTML served from the CDN, so reader performance matches a static export.
- Hosting is tied to a platform that runs the Next.js build output (Vercel today). Moving to a plain static host later means switching to static export and moving headers, redirects and image optimisation to that host.
- A feature that needs request-time rendering still needs its own ADR ([ADR-0001](ADR-0001-reader-first-no-backend.md)).
