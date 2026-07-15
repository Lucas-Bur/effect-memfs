import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const truncate =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["truncate"] =>
  (path, length) =>
    fromPromise(
      () => vol.promises.truncate(resolvePath(path), Number(length ?? 0)),
      "truncate",
      path,
    )
