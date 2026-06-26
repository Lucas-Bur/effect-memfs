import { expect, it } from "@effect/vitest"
import { Effect, FileSystem, Option } from "effect"

import { layerWith } from "../src/index.js"

const TestLayer = layerWith({
  "/file.txt": "content",
})

it.effect("utimes updates atime and mtime", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const atime = new Date("2026-01-01")
    const mtime = new Date("2026-06-26")
    yield* fs.utimes("/file.txt", atime, mtime)
    const info = yield* fs.stat("/file.txt")
    const statAtime = Option.getOrThrow(info.atime)
    const statMtime = Option.getOrThrow(info.mtime)
    expect(statAtime.getTime()).toBe(atime.getTime())
    expect(statMtime.getTime()).toBe(mtime.getTime())
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("utimes nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.utimes("/nope.txt", new Date(), new Date()))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
