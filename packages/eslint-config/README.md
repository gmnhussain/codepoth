# `@workspace/eslint-config`

Shared ESLint flat configs for the workspace. Rules and rationale: [conventions §6](../../docs/development/conventions.md#6-tooling).

| Export           | Use                                                    |
| ---------------- | ------------------------------------------------------ |
| `base`           | TypeScript, type-aware (`strictTypeChecked`), import-x |
| `next-js`        | `base` + Next.js and React hooks rules                 |
| `react-internal` | `base` + React hooks rules, for React packages         |

Each package's `eslint.config.js` sets `parserOptions.tsconfigRootDir: import.meta.dirname` so the TypeScript project service finds that package's `tsconfig.json`.
