import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

// NOTE: Unlike NodeFileSystem, memfs has no AbortSignal support,
// so we skip the `signal` option that the reference passes to fs.readFile.
// memfs returns Buffer (extends Uint8Array) when no encoding is given, and
// FileSystem.make() reads the result via TextDecoder, so the cast should be safe.

export const readFile =
  (vol: Volume): FileSystem.FileSystem["readFile"] =>
  (path) =>
    fromPromise(() => vol.promises.readFile(path) as Promise<Uint8Array>, "readFile", path)
