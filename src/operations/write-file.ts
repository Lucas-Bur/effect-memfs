import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"

// NOTE: Unlike NodeFileSystem, memfs has no AbortSignal support,
// so we skip the `signal` option that the reference passes to fs.writeFile.

export const writeFile =
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["writeFile"] =>
  (path, data, options) =>
    fromPromise(
      () =>
        vol.promises.writeFile(resolvePath(path), data, {
          ...(options?.flag !== undefined && { flag: options.flag }),
          ...(options?.mode !== undefined && { mode: options.mode }),
        }),
      "writeFile",
      path,
    )
