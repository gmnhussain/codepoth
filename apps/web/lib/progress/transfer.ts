import { z } from "zod"

import { localDay, pruneActivity } from "./days"
import { progressSchema } from "./progress.schema"
import type { Progress } from "./progress.schema"

/**
 * The export/import file (ADR-0007, ADR-0014):
 * `{ format: "codepoth-progress", version: 1, exportedAt, data }`.
 */

export const EXPORT_FORMAT = "codepoth-progress"
export const EXPORT_VERSION = 1

/** Largest import file read, checked on `File.size` before reading. */
export const MAX_IMPORT_BYTES = 1024 * 1024

export const IMPORT_ERRORS = [
  "too-large",
  "not-json",
  "wrong-format",
  "unsupported-version",
  "invalid-data",
] as const

export type ImportError = (typeof IMPORT_ERRORS)[number]

export type ImportResult =
  | { readonly ok: true; readonly data: Progress }
  | { readonly ok: false; readonly error: ImportError }

const exportFileSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.iso.datetime(),
  data: progressSchema,
})

export type ExportFile = z.infer<typeof exportFileSchema>

export function createExport(progress: Progress, now: Date): ExportFile {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    data: progress,
  }
}

/** `"too-large"` for a file over the limit, else `undefined`. */
export function checkImportSize(bytes: number): ImportError | undefined {
  return bytes > MAX_IMPORT_BYTES ? "too-large" : undefined
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Reads an import file's text. The whole file must be valid; nothing is
 * dropped quietly, so the reader's progress is only changed by a file that
 * is exactly what an export wrote. Activity outside the window ending on
 * `now` is pruned.
 */
export function parseImport(text: string, now: Date): ImportResult {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, error: "not-json" }
  }
  if (!isObject(value) || value.format !== EXPORT_FORMAT) {
    return { ok: false, error: "wrong-format" }
  }
  if (value.version !== EXPORT_VERSION) {
    return { ok: false, error: "unsupported-version" }
  }
  const file = exportFileSchema.safeParse(value)
  if (!file.success) return { ok: false, error: "invalid-data" }
  const { data } = file.data
  return {
    ok: true,
    data: { ...data, activity: pruneActivity(data.activity, localDay(now)) },
  }
}
