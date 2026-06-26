import type { FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

export const link =
  (vol: Volume): FileSystem.FileSystem["link"] =>
  (existingPath, newPath) =>
    fromPromise(() => vol.promises.link(existingPath, newPath), "link", existingPath)
