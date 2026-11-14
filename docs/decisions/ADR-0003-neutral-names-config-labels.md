# ADR-0003: Neutral names in code, display terms in config

- Status: accepted
- Date: 2026-11-13

## Context

The roadmap uses a metro-map visual, but the reader-facing words (লাইন/স্টেশন vs পথ/ধাপ), the site name and the logo are not decided yet.

## Decision

- Code always uses track / topic / group / lesson / section.
- Every UI string lives in `packages/config/src/labels/*.json` and is read through one helper (`t("…")`). The active label set and the site name/logo are chosen in `packages/config/src/site.ts`.
- No Bangla UI string is hardcoded in a component.

## Consequences

- Switching terminology or branding is a config change, not a refactor.
- Every new UI string needs a label key in all label files.
