import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const link =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["link"] =>
  (existingPath, newPath) =>
    fromPromise(
      () => vol.promises.link(resolvePath(existingPath), resolvePath(newPath)),
      "link",
      existingPath,
    )
