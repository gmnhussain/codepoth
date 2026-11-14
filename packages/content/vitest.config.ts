import { defineConfig } from "vitest/config"

// Conventions §14: no globals, mocks reset between tests.
export default defineConfig({
  test: {
    globals: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
