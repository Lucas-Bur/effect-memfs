import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

// memfs returns string by default for readlink (encoding = 'utf8').

export const readLink =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["readLink"] =>
  (path) =>
    fromPromise(() => vol.promises.readlink(resolvePath(path)) as Promise<string>, "readlink", path)
