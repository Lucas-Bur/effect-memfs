import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const utimes =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["utimes"] =>
  (path, atime, mtime) =>
    fromPromise(() => vol.promises.utimes(resolvePath(path), atime, mtime), "utimes", path)
