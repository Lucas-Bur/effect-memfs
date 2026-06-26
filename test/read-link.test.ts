import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layerWith } from "../src/index.js"

const TestLayer = layerWith({
  "/target": "link me",
})

it.effect("readLink resolves symlink target", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.symlink("/target", "/link")
    const target = yield* fs.readLink("/link")
    expect(target).toBe("/target")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readLink on non-symlink returns InvalidData", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.readLink("/target"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("InvalidData")
  }).pipe(Effect.provide(TestLayer)),
)
