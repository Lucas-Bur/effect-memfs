import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

export const chmod =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["chmod"] =>
  (path, mode) =>
    fromPromise(() => vol.promises.chmod(resolvePath(path), mode), "chmod", path)
