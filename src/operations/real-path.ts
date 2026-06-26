import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

// memfs returns string by default for realpath (encoding = 'utf8').

export const realPath =
  (vol: Volume): FileSystem.FileSystem["realPath"] =>
  (path) =>
    fromPromise(() => vol.promises.realpath(path) as Promise<string>, "realpath", path)
