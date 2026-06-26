import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/source.txt": "source content",
  "/existing.txt": "existing",
})

it.effect("copies a file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.copyFile("/source.txt", "/copy.txt")
    const content = yield* fs.readFileString("/copy.txt")
    expect(content).toBe("source content")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("copyFile overwrites existing destination", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.copyFile("/source.txt", "/existing.txt")
    const content = yield* fs.readFileString("/existing.txt")
    expect(content).toBe("source content")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("copyFile nonexistent source returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.copyFile("/nope.txt", "/any.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
