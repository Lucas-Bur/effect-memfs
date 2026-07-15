import { Effect, type FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import type { ResolvePath } from "../helpers/volume.js"
import { removeFactory } from "./remove.js"

export const makeTempDirectoryFactory =
  (method: string) =>
  (vol: Volume, resolvePath: ResolvePath): FileSystem.FileSystem["makeTempDirectory"] =>
  (options) =>
    fromPromise(async () => {
      const base = resolvePath(typeof options?.directory === "string" ? options.directory : "/tmp")
      await vol.promises.mkdir(base, { recursive: true })
      return vol.promises.mkdtemp(base + "/" + (options?.prefix ?? "")) as Promise<string>
    }, method)

export const makeTempDirectory = makeTempDirectoryFactory("makeTempDirectory")

export const makeTempDirectoryScoped = (
  vol: Volume,
  resolvePath: ResolvePath,
): FileSystem.FileSystem["makeTempDirectoryScoped"] => {
  const makeDir = makeTempDirectoryFactory("makeTempDirectoryScoped")(vol, resolvePath)
  const rmDir = removeFactory("makeTempDirectoryScoped")(vol, resolvePath)
  return (options) =>
    Effect.acquireRelease(makeDir(options), (dir) => Effect.orDie(rmDir(dir, { recursive: true })))
}
