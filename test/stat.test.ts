import { it } from "@effect/vitest"
import { Effect, FileSystem, Option } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/file.txt": "Hello, World!",
  "/empty.txt": "",
  "/sub": null,
})

it.effect("stats a file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const info = yield* fs.stat("/file.txt")
    expect(info.type).toBe("File")
    expect(info.size).toBe(FileSystem.Size(13))
    expect(dev(info.dev)).toBe(0)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("stats a directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const info = yield* fs.stat("/sub")
    expect(info.type).toBe("Directory")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("stats empty file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const info = yield* fs.stat("/empty.txt")
    expect(info.type).toBe("File")
    expect(info.size).toBe(FileSystem.Size(0))
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("stat nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.stat("/nope.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("stat root directory returns Directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const info = yield* fs.stat("/")
    expect(info.type).toBe("Directory")
  }).pipe(Effect.provide(TestLayer)),
)

const dev = (v: number | Option.Option<number>): number =>
  Option.isOption(v) ? Option.getOrElse(v, () => 0) : v
