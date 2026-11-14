# `@workspace/typescript-config`

Shared typescript configuration for the workspace.

| Config                | For                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `base.json`           | strict compiler flags shared by everything                                                                         |
| `nextjs.json`         | Next.js apps                                                                                                       |
| `react-library.json`  | `packages/ui`                                                                                                      |
| `source-package.json` | packages that ship TypeScript source to a bundler (`config`, `content`): Bundler resolution, extensionless imports |
