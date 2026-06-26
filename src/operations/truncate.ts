import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const truncate =
  (vol: Volume): FileSystem.FileSystem["truncate"] =>
  (path, length) =>
    fromPromise(() => vol.promises.truncate(path, Number(length ?? 0)), "truncate", path)
