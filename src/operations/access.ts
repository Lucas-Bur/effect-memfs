import type { FileSystem } from "effect"
import type { Volume } from "memfs"
import { fs } from "memfs"

import { fromPromise } from "../helpers/promise.js"

const { F_OK, R_OK, W_OK } = fs.constants

const accessMode = (
  options?: Parameters<FileSystem.FileSystem["access"]>[1],
): number | undefined => {
  if (!options) return undefined
  let mode = F_OK
  if (options.readable) mode |= R_OK
  if (options.writable) mode |= W_OK
  return mode
}

export const access =
  (vol: Volume): FileSystem.FileSystem["access"] =>
  (path, options) =>
    fromPromise(() => vol.promises.access(path, accessMode(options)), "access", path)
