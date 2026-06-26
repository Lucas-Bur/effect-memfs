import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const chmod =
  (vol: Volume): FileSystem.FileSystem["chmod"] =>
  (path, mode) =>
    fromPromise(() => vol.promises.chmod(path, mode), "chmod", path)
