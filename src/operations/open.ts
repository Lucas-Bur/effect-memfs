import { Effect, FileSystem } from "effect"
import { pipe } from "effect/Function"
import type { Volume } from "memfs"

import { fromSync } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"
import { makeFile } from "./make-file.js"

export const openFactory =
  (method: string) =>
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["open"] => {
    const createFile = makeFile(vol)
    return (path, options) =>
      pipe(
        Effect.acquireRelease(
          fromSync(
            () => vol.openSync(resolvePath(path), options?.flag ?? "r", options?.mode),
            method,
            path,
          ),
          (rawFd) => Effect.orDie(fromSync(() => vol.closeSync(rawFd), method, path)),
        ),
        Effect.map((rawFd) =>
          createFile(
            FileSystem.FileDescriptor(rawFd),
            options?.flag?.startsWith("a") ?? false,
            path,
          ),
        ),
      )
  }

export const open = (vol: Volume, resolvePath: ResolvePath) => openFactory("open")(vol, resolvePath)
