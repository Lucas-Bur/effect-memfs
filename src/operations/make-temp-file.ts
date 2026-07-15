import { Effect, type FileSystem } from "effect"
import type { Volume } from "memfs"

import type { ResolvePath } from "../helpers/volume.js"
import { makeTempDirectoryFactory } from "./make-temp-directory.js"
import { removeFactory } from "./remove.js"
import { writeFile } from "./write-file.js"

const makeTempFileFactory =
  (method: string) =>
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["makeTempFile"] => {
    const makeDir = makeTempDirectoryFactory(method)(vol, resolvePath)
    const write = writeFile(vol, resolvePath)
    return Effect.fnUntraced(function* (options) {
      const dir = yield* makeDir(options)
      const random = Math.random().toString(16).slice(2, 14)
      const name = dir + "/" + (options?.suffix ? `${random}${options.suffix}` : random)
      yield* write(name, new Uint8Array(0))
      return name
    })
  }

export const makeTempFile = makeTempFileFactory("makeTempFile")

export const makeTempFileScoped = (
  vol: Volume,
  resolvePath: ResolvePath,
): FileSystem.FileSystem["makeTempFileScoped"] => {
  const makeFile = makeTempFileFactory("makeTempFileScoped")(vol, resolvePath)
  const rmDir = removeFactory("makeTempFileScoped")(vol, resolvePath)
  return (options) =>
    Effect.acquireRelease(makeFile(options), (file) =>
      Effect.orDie(rmDir(file.slice(0, file.lastIndexOf("/")), { recursive: true })),
    )
}
