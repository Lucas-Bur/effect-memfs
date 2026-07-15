import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const chown =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["chown"] =>
  (path, uid, gid) =>
    fromPromise(() => vol.promises.chown(resolvePath(path), uid, gid), "chown", path)
