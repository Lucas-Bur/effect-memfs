import { expect, it } from "@effect/vitest"
import { Effect, FileSystem, Option } from "effect"

import { layerWith } from "../src/index.js"

const TestLayer = layerWith({
  "/file.txt": "content",
})

it.effect("chown changes file uid and gid", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.chown("/file.txt", 1000, 100)
    const info = yield* fs.stat("/file.txt")
    expect(Option.getOrThrow(info.uid)).toBe(1000)
    expect(Option.getOrThrow(info.gid)).toBe(100)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("chown nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.chown("/nope.txt", 1000, 100))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
