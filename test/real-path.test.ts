import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layerWith } from "../src/index.js"

const TestLayer = layerWith({
  "/foo": "bar",
  "/dir": null,
})

it.effect("realPath resolves a file path", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* fs.realPath("/foo")
    expect(result).toBe("/foo")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("realPath resolves a directory path", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* fs.realPath("/dir")
    expect(result).toBe("/dir")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("realPath missing path returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.realPath("/missing"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
