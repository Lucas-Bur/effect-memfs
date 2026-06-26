import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const rename =
  (vol: Volume): FileSystem.FileSystem["rename"] =>
  (oldPath, newPath) =>
    fromPromise(() => vol.promises.rename(oldPath, newPath), "rename", oldPath)
