import { expect, it } from "@effect/vitest"
import { Effect, FileSystem, Option } from "effect"

import { layerWith } from "../src/index.js"

const TestLayer = layerWith({
  "/source/file.txt": "content",
  "/dest/file.txt": "old",
})

it.effect("copies a file with copy", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.copy("/source/file.txt", "/target.txt")
    const content = yield* fs.readFileString("/target.txt")
    expect(content).toBe("content")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("copies a directory recursively", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.copy("/source", "/backup")
    const content = yield* fs.readFileString("/backup/file.txt")
    expect(content).toBe("content")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect(
  "copy to existing destination without options returns AlreadyExists (default no-overwrite)",
  () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const result = yield* Effect.flip(fs.copy("/source/file.txt", "/dest/file.txt"))
      expect(result._tag).toBe("PlatformError")
      expect(result.reason._tag).toBe("AlreadyExists")
    }).pipe(Effect.provide(TestLayer)),
)

it.effect("copy with overwrite=true replaces destination", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.copy("/source/file.txt", "/dest/file.txt", { overwrite: true })
    const content = yield* fs.readFileString("/dest/file.txt")
    expect(content).toBe("content")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("copy to existing destination with overwrite=false returns AlreadyExists", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(
      fs.copy("/source/file.txt", "/dest/file.txt", { overwrite: false }),
    )
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("AlreadyExists")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("copy with preserveTimestamps=true keeps mtime (within 5ms tolerance)", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const srcStat = yield* fs.stat("/source/file.txt")
    yield* fs.copy("/source/file.txt", "/target-pts.txt", { preserveTimestamps: true })
    const dstStat = yield* fs.stat("/target-pts.txt")
    const srcMtime = Option.getOrThrow(srcStat.mtime)
    const dstMtime = Option.getOrThrow(dstStat.mtime)
    expect(Math.abs(dstMtime.getTime() - srcMtime.getTime())).toBeLessThanOrEqual(5)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("copy with preserveTimestamps=false updates mtime", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const srcStat = yield* fs.stat("/source/file.txt")
    yield* fs.copy("/source/file.txt", "/target-nopts.txt", { preserveTimestamps: false })
    const dstStat = yield* fs.stat("/target-nopts.txt")
    const srcMtime = Option.getOrThrow(srcStat.mtime)
    const dstMtime = Option.getOrThrow(dstStat.mtime)
    // without preserve, target gets a fresh timestamp (>= source)
    expect(dstMtime.getTime()).toBeGreaterThanOrEqual(srcMtime.getTime())
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("copy nonexistent source returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.copy("/nope.txt", "/any.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
