import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const copyFile =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["copyFile"] =>
  (from, to) =>
    fromPromise(() => vol.promises.copyFile(resolvePath(from), resolvePath(to)), "copyFile", from)
