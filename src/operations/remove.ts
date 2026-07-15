import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const removeFactory =
  (method: string) =>
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["remove"] =>
  (path, options) =>
    fromPromise(
      () =>
        vol.promises.rm(resolvePath(path), {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        }),
      method,
      path,
    )

export const remove = removeFactory("remove")
