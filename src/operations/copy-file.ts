import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const copyFile =
  (vol: Volume): FileSystem.FileSystem["copyFile"] =>
  (from, to) =>
    fromPromise(() => vol.promises.copyFile(from, to), "copyFile", from)
