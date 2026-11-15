import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// Conventions §14: no globals, mocks reset between tests.
export default defineConfig({
  // The `@/*` path from tsconfig.json; `@workspace/*` packages do not match it.
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    globals: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
