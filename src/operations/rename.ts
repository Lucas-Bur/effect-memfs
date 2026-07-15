import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const rename =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["rename"] =>
  (oldPath, newPath) =>
    fromPromise(
      () => vol.promises.rename(resolvePath(oldPath), resolvePath(newPath)),
      "rename",
      oldPath,
    )
