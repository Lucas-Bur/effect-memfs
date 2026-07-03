import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

// Match the shape of `node:fs/promises.readdir(path, { recursive: true })`:
// paths are returned relative to the input, separated by forward slashes, and
// intermediate directories are included. memfs returns relative paths only
// when the input has no trailing slash, so we strip one (keeping the root `/`).
// For root itself, memfs returns absolute paths — we drop the leading `/`.
const stripTrailingSlash = (p: string): string =>
  p === "/" ? p : p.endsWith("/") ? p.slice(0, -1) : p

export const readDirectory =
  (vol: Volume): FileSystem.FileSystem["readDirectory"] =>
  (path, options) =>
    fromPromise(
      () => {
        const dir = vol.promises.readdir(stripTrailingSlash(path), {
          recursive: options?.recursive ?? false,
        }) as Promise<string[]>
        return dir.then((entries) => entries.map((e) => (e.startsWith("/") ? e.slice(1) : e)))
      },
      "readDirectory",
      path,
    )
