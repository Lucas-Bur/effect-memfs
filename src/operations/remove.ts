import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const removeFactory =
  (method: string) =>
  (vol: Volume): FileSystem.FileSystem["remove"] =>
  (path, options) =>
    fromPromise(
      () =>
        vol.promises.rm(path, {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        }),
      method,
      path,
    )

export const remove = removeFactory("remove")
