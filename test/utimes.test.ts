import { expect, it } from "@effect/vitest"
import { Effect, FileSystem, Option } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
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
    yield* expectError(fs.utimes("/nope.txt", new Date(), new Date()), "NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
