import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const copy =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["copy"] =>
  (from, to, options) =>
    fromPromise(
      () =>
        vol.promises.cp(resolvePath(from), resolvePath(to), {
          recursive: true,
          force: options?.overwrite ?? false,
          errorOnExist: options?.overwrite !== true,
          preserveTimestamps: options?.preserveTimestamps ?? false,
        }),
      "copy",
      from,
    )
