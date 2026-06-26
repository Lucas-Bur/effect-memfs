import { Effect, type FileSystem } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"
import { removeFactory } from "./remove.js"

export const makeTempDirectoryFactory =
  (method: string) =>
  (vol: Volume): FileSystem.FileSystem["makeTempDirectory"] =>
  (options) =>
    fromPromise(async () => {
      const base = typeof options?.directory === "string" ? options.directory : "/tmp"
      await vol.promises.mkdir(base, { recursive: true })
      return vol.promises.mkdtemp(base + "/" + (options?.prefix ?? "")) as Promise<string>
    }, method)

export const makeTempDirectory = makeTempDirectoryFactory("makeTempDirectory")

export const makeTempDirectoryScoped = (
  vol: Volume,
): FileSystem.FileSystem["makeTempDirectoryScoped"] => {
  const makeDir = makeTempDirectoryFactory("makeTempDirectoryScoped")(vol)
  const rmDir = removeFactory("makeTempDirectoryScoped")(vol)
  return (options) =>
    Effect.acquireRelease(makeDir(options), (dir) => Effect.orDie(rmDir(dir, { recursive: true })))
}
