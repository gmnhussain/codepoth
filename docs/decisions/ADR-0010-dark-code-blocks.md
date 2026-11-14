# ADR-0010: Dark code blocks with one Shiki theme

- Status: accepted
- Date: 2026-11-14
- Amends: [ADR-0008](ADR-0008-design-tokens.md) (adds a token)

## Context

ADR-0008 says code-block colours come from a Shiki theme, not from tokens, but does not say which theme or what the block's background is. In the design the code block is dark in both colour modes (`--code`: `#1C1A17` in light, `#0C0B0A` in dark) with light text. shadcn has no slot for such a surface. A light/dark theme pair would follow the page's mode, which the design does not do.

Most built-in dark Shiki themes fail WCAG AA on these backgrounds; GitHub Dark's comment colour, for example, is below 3:1. Checked on 2026-11-14 over every dark theme bundled with Shiki 4.6: the lowest token contrast on both backgrounds was 6.15:1 for Catppuccin Mocha, 6.24:1 for Catppuccin Macchiato and 5.35:1 for Everforest Dark; most others were below 4.5:1.

## Decision

- Two new tokens: `--code`, the code-block background (`#1C1A17` in light mode, `#0C0B0A` in dark mode, `bg-code`), and `--code-foreground` (`#EDE8DE` in both, the design's code text colour) for the file-name caption and line numbers (`text-code-foreground`). They are the only additions to ADR-0008's palette.
- Every code block uses one dark Shiki theme in both modes: **Catppuccin Mocha** (`CODE_THEME` in `packages/content/src/mdx/compile.ts`). Its keyword, string and function colours are close to the design's (pink, green, blue).
- The theme's background is not used (`keepBackground: false`); the block sits on `--code`.
- Inline `code` in prose is not highlighted; the page styles it like other text.
- `packages/content/src/mdx/code-theme.test.ts` checks every text colour of the theme, and `--code-foreground`, against both `--code` values at 4.5:1, so a theme or token change that breaks AA fails `pnpm test`.

## Alternatives considered

- **A light/dark theme pair** (`github-light` / `github-dark`). Rejected: the design's code block is dark in both modes, and GitHub Dark fails AA on these backgrounds.
- **A custom theme with the design's exact colours.** Rejected for now: a full theme needs colours for every token type, while a maintained theme covers them already. It can replace Catppuccin later if the contrast test passes.
- **Using the theme's own background.** Rejected: the surface would change whenever the theme does, and it would not match the design.

## Consequences

- Code blocks look the same in light and dark mode, as in the design.
- Shiki's highlighting is written into the compiled MDX as inline colours at build time; no highlighter reaches the browser.
- Changing the theme means one constant and a passing contrast test.
