import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

// memfs returns string by default for readlink (encoding = 'utf8').

export const readLink =
  (vol: Volume): FileSystem.FileSystem["readLink"] =>
  (path) =>
    fromPromise(() => vol.promises.readlink(path) as Promise<string>, "readlink", path)
