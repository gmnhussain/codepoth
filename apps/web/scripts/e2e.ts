/**
 * `pnpm test:e2e`: builds the site and runs the Playwright tests against it,
 * first with drafts (the full suite), then without (the production content,
 * a smoke run). Both builds write `.next`, so they run in turn. Node runs
 * this file directly (`node scripts/e2e.ts`), and it sets the build's
 * environment itself, so the same command works in every shell.
 *
 * Options:
 * - `--only drafts|published`: one build and its tests.
 * - `--skip-build`: test the build already in `.next`, with the content it
 *   was built with (or the one `--only` names, which must match).
 * - anything else is passed to `playwright test` (a spec file, `--grep`, …).
 */
import { spawn } from "node:child_process"
import { readFile, readdir, rm, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { parseArgs } from "node:util"

// With its extension: Node runs this file directly.
import {
  BUILD_MARKER_FILE,
  CONTENT_MODES,
  CONTENT_MODE_VARIABLE,
  contentModeOf,
  includeDraftsValueOf,
} from "../e2e/support/content-mode.ts"
import type { ContentMode } from "../e2e/support/content-mode.ts"

const APP_DIR = path.resolve(import.meta.dirname, "..")
const REPO_ROOT = path.resolve(APP_DIR, "..", "..")
const DIST_DIR = path.join(APP_DIR, ".next")
const MARKER_PATH = path.join(DIST_DIR, BUILD_MARKER_FILE)
/**
 * Kept in `.next`: the same entries `next build` keeps when it cleans the
 * folder itself. `cache` is Next's build cache (it never holds pages), and
 * `dev` belongs to a running `next dev` (turbo's outputs leave it out too),
 * which a test build must not disturb.
 */
const KEPT_ENTRIES = new Set(["cache", "dev", "diagnostics", "lock", "trace"])
const SEARCH_INDEX_DIR = path.join(APP_DIR, "public", "pagefind")

function fail(message: string): never {
  process.stderr.write(`e2e: ${message}\n`)
  process.exit(1)
}

/** Runs a command with this terminal's output; resolves to its exit code. */
function run(
  command: string,
  args: readonly string[],
  options: { readonly cwd: string; readonly env: NodeJS.ProcessEnv }
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => {
      resolve(code ?? 1)
    })
  })
}

/**
 * Removes the previous build. A turbo cache hit restores the cached build's
 * files over whatever `.next` holds and deletes nothing, so after a build
 * of the other content `next start` served a mix of both (pages linking to
 * drafts in the build without them). A real `next build` cleans `.next`
 * itself; a restore does not.
 */
async function removePreviousBuild(): Promise<void> {
  const entries = await readdir(DIST_DIR).catch(() => [])
  for (const entry of entries) {
    if (KEPT_ENTRIES.has(entry)) continue
    await rm(path.join(DIST_DIR, entry), { recursive: true, force: true })
  }
  await rm(SEARCH_INDEX_DIR, { recursive: true, force: true })
}

/** Builds the site for a mode through Turborepo (content first). */
async function build(mode: ContentMode): Promise<void> {
  // pnpm sets npm_execpath to its own entry script; running it with this
  // Node avoids spawning `pnpm.cmd` through a shell on Windows.
  const pnpm = process.env.npm_execpath
  if (pnpm === undefined || pnpm === "") {
    fail("run this through pnpm (`pnpm test:e2e`)")
  }
  process.stdout.write(`\ne2e: building with content "${mode}"\n`)
  await removePreviousBuild()
  const code = await run(
    process.execPath,
    [pnpm, "exec", "turbo", "run", "build", "--filter=web", "--ui=stream"],
    {
      cwd: REPO_ROOT,
      // An explicitly set variable wins over apps/web/.env.local.
      env: {
        ...process.env,
        CONTENT_INCLUDE_DRAFTS: includeDraftsValueOf(mode),
      },
    }
  )
  if (code !== 0) fail(`the "${mode}" build failed`)
  await writeFile(MARKER_PATH, mode)
}

async function builtMode(): Promise<ContentMode | undefined> {
  try {
    return contentModeOf(await readFile(MARKER_PATH, "utf8"))
  } catch {
    return undefined
  }
}

async function test(
  mode: ContentMode,
  playwrightArgs: readonly string[]
): Promise<void> {
  const cli = createRequire(import.meta.url).resolve("@playwright/test/cli")
  process.stdout.write(`\ne2e: testing the "${mode}" build\n`)
  const code = await run(
    process.execPath,
    [cli, "test", `--project=${mode}`, ...playwrightArgs],
    { cwd: APP_DIR, env: { ...process.env, [CONTENT_MODE_VARIABLE]: mode } }
  )
  if (code !== 0) fail(`tests failed on the "${mode}" build`)
}

async function main() {
  // Only our two options are read here; everything else in argv goes to
  // Playwright as given.
  const { values } = parseArgs({
    options: {
      only: { type: "string" },
      "skip-build": { type: "boolean", default: false },
    },
    allowPositionals: true,
    strict: false,
  })
  const only =
    typeof values.only === "string" ? contentModeOf(values.only) : undefined
  if (values.only !== undefined && only === undefined) {
    fail(`--only takes one of: ${CONTENT_MODES.join(", ")}`)
  }
  const passThrough = process.argv
    .slice(2)
    .filter(
      (arg, index, args) =>
        arg !== "--skip-build" &&
        arg !== "--only" &&
        args[index - 1] !== "--only" &&
        !arg.startsWith("--only=")
    )

  if (values["skip-build"] === true) {
    const mode = await builtMode()
    if (mode === undefined) {
      fail("no build marked for end-to-end tests; run without --skip-build")
    }
    if (only !== undefined && only !== mode) {
      fail(`.next was built with "${mode}" content, not "${only}"`)
    }
    await test(mode, passThrough)
    return
  }

  for (const mode of only === undefined ? CONTENT_MODES : [only]) {
    await build(mode)
    await test(mode, passThrough)
  }
}

await main()
