import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const copy =
  (vol: Volume): FileSystem.FileSystem["copy"] =>
  (from, to, options) =>
    fromPromise(
      () =>
        vol.promises.cp(from, to, {
          recursive: true,
          force: options?.overwrite ?? false,
          errorOnExist: options?.overwrite !== true,
          preserveTimestamps: options?.preserveTimestamps ?? false,
        }),
      "copy",
      from,
    )
