import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const utimes =
  (vol: Volume): FileSystem.FileSystem["utimes"] =>
  (path, atime, mtime) =>
    fromPromise(() => vol.promises.utimes(path, atime, mtime), "utimes", path)
