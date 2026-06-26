import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const makeDirectory =
  (vol: Volume): FileSystem.FileSystem["makeDirectory"] =>
  (path, options) =>
    fromPromise(
      () =>
        vol.promises.mkdir(path, {
          recursive: options?.recursive ?? false,
          mode: options?.mode,
        }),
      "makeDirectory",
      path,
    )
