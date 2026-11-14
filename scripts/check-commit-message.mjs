/**
 * Entry point of the commit-msg hook: validates the message file git passes in.
 * Usage: node scripts/check-commit-message.mjs <message-file>
 */
import { readFileSync } from "node:fs"

import { validateCommitMessage } from "./commit-message.mjs"

const messageFile = process.argv[2]
if (messageFile === undefined) {
  process.stderr.write(
    "Usage: node scripts/check-commit-message.mjs <message-file>\n"
  )
  process.exit(2)
}

const errors = validateCommitMessage(readFileSync(messageFile, "utf8"))
if (errors.length > 0) {
  process.stderr.write(
    [
      "Commit message rejected (docs/development/conventions.md §3):",
      ...errors.map((error) => `  - ${error}`),
      "",
    ].join("\n")
  )
  process.exit(1)
}
