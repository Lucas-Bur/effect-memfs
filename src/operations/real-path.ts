import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

// memfs returns string by default for realpath (encoding = 'utf8').

export const realPath =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["realPath"] =>
  (path) =>
    fromPromise(() => vol.promises.realpath(resolvePath(path)) as Promise<string>, "realpath", path)
