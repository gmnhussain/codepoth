# ADR-0012: About page as content, with a privacy section that stays true

- Status: accepted
- Date: 2026-11-14
- Details: [ADR-0005](ADR-0005-content-layer.md) (content layer), [ADR-0011](ADR-0011-mdx-compiled-at-build-time.md) (MDX compiled at build time), [ADR-0001](ADR-0001-reader-first-no-backend.md) (no backend, no tracking)

## Context

The spec lists an About page with a privacy section, and the footer links to it as `/about#privacy`. Its prose is the author's, so it belongs with the content, not in label sets or components. The privacy section makes factual claims about the site (what is stored, what is sent), which become false the moment code changes and the text does not.

## Decision

- `content/pages/about.mdx` is a Content Collections singleton, required (the build fails without it). Frontmatter: `title`, `description` (lead and meta description), `updated`, `draft` (default `false`), checked by `packages/content/src/schemas/about.schema.ts`.
- The body is MDX compiled at build time like a glossary definition: prose, `##`/`###` headings, lists, links, bold, inline code, and one component, `<Privacy>…</Privacy>`. A remark step (`packages/content/src/mdx/about.ts`) fails the build unless the page has exactly one `<Privacy>` and no other component, so the footer link always has a target.
- `<Privacy>` renders the prose inside it as `<section id="privacy">` under a heading from the labels.
- `draft: true` works as for lessons: the page is shown only when drafts are included. Otherwise `/about` is a 404 and the footer leaves out the "সম্পর্কে" and "প্রাইভেসি" links.
- **The privacy text must be literally true, and it changes in the same commit as the code it describes.** Today it states: no analytics, no tracking, no cookies, no third-party scripts; two localStorage keys, `codepoth:v1` (reader progress, [ADR-0007](ADR-0007-reader-progress-shape.md)) and `theme` (next-themes' colour preference); progress is never sent anywhere; fonts are served by the site itself (`next/font`), with no request to Google; the host (Vercel) may keep standard access logs (IP address, requested page). Any change that affects these facts (a storage key, a cookie, a third-party script or font, comments with Giscus later, a different host) updates the privacy section in the same commit.
- The seeded text is a draft by the author's choice. It names `codepoth:v1`, which the code starts writing in Phase 3, so the page is not published before Phase 3 unless that line changes.

## Alternatives considered

- **Prose in the label sets.** Rejected: labels are short UI strings shared by both naming sets; a page of prose is content.
- **A heading anchor (`## প্রাইভেসি`) as the privacy target.** Rejected: the id would follow the heading's wording, so editing the heading would break the footer link.
- **A general `pages` collection.** Rejected for now: About is the only page of prose; a collection can follow when a second page needs it (the same rule as for packages).

## Consequences

- The author edits About like a lesson, and a missing or duplicated privacy section fails the build instead of shipping a dead link.
- Reviews of code that touches storage, cookies, scripts, fonts or hosting must check `content/pages/about.mdx`.
