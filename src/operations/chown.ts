import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const chown =
  (vol: Volume): FileSystem.FileSystem["chown"] =>
  (path, uid, gid) =>
    fromPromise(() => vol.promises.chown(path, uid, gid), "chown", path)
