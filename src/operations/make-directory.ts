import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const makeDirectory =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["makeDirectory"] =>
  (path, options) =>
    fromPromise(
      () =>
        vol.promises.mkdir(resolvePath(path), {
          recursive: options?.recursive ?? false,
          mode: options?.mode,
        }),
      "makeDirectory",
      path,
    )
