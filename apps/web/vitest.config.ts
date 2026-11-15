import { fileURLToPath } from "node:url"

import { configDefaults, defineConfig } from "vitest/config"

// Conventions §14: no globals, mocks reset between tests.
export default defineConfig({
  // The `@/*` path from tsconfig.json; `@workspace/*` packages do not match it.
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    // Playwright's end-to-end specs (`*.spec.ts`) run with `pnpm test:e2e`.
    exclude: [...configDefaults.exclude, "e2e/**"],
    globals: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
