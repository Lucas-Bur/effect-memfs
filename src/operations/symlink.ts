import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const symlink =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["symlink"] =>
  (target, path) =>
    fromPromise(() => vol.promises.symlink(target, resolvePath(path)), "symlink", path)
