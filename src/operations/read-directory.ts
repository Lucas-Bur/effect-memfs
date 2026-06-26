import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

// NOTE: memfs returns paths with a leading "/" in recursive mode
// when the root directory is read, so we normalize them.

export const readDirectory =
  (vol: Volume): FileSystem.FileSystem["readDirectory"] =>
  (path, options) =>
    fromPromise(
      () => {
        const dir = vol.promises.readdir(path, {
          recursive: options?.recursive ?? false,
        }) as Promise<string[]>

        return options?.recursive
          ? dir.then((entries) => entries.map((e) => (e.startsWith("/") ? e.slice(1) : e)))
          : dir
      },
      "readDirectory",
      path,
    )
