import { defineConfig, devices } from "@playwright/test"

import {
  CONTENT_MODE_VARIABLE,
  contentModeOf,
} from "./e2e/support/content-mode"

/** Never 3000, where a developer's own `next dev` runs. */
const PORT = 3418

const mode = contentModeOf(process.env[CONTENT_MODE_VARIABLE])
if (mode === undefined) {
  throw new Error(
    `${CONTENT_MODE_VARIABLE} is not set: run the end-to-end tests with \`pnpm test:e2e\`, which builds the site first`
  )
}

const isCi = process.env.CI !== undefined

/**
 * End-to-end tests on the production build (conventions §14). A test runs
 * on the drafts build unless it is tagged: `@both` also runs on the build
 * without drafts, `@published` only there.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: 0,
  reporter: isCi ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${String(PORT)}`,
    trace: "retain-on-failure",
  },
  projects: [
    mode === "drafts"
      ? { name: "drafts", grepInvert: /@published\b/ }
      : { name: "published", grep: /@both\b|@published\b/ },
  ],
  webServer: {
    // Next's own bin, not `pnpm start`, so stopping the server stops Node
    // itself and frees the port.
    command: `node node_modules/next/dist/bin/next start -p ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}`,
    // A server already on the port is an error, never reused.
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
