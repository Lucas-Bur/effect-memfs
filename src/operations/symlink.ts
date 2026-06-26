import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const symlink =
  (vol: Volume): FileSystem.FileSystem["symlink"] =>
  (target, path) =>
    fromPromise(() => vol.promises.symlink(target, path), "symlink", path)
