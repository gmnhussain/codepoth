/**
 * Points git at the versioned hooks in .githooks/ (conventions §6).
 * Runs from the root `prepare` script; does nothing outside a git work tree
 * (for example a Vercel or tarball install), so installs never fail because of it.
 */
import { execFileSync } from "node:child_process"

const HOOKS_PATH = ".githooks"

function isInsideGitWorkTree() {
  try {
    const output = execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    return output.trim() === "true"
  } catch {
    // git is not installed, or this is not a repository.
    return false
  }
}

if (isInsideGitWorkTree()) {
  execFileSync("git", ["config", "core.hooksPath", HOOKS_PATH], {
    stdio: "inherit",
  })
}
