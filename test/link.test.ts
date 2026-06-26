import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layerWith } from "../src/index.js"

const TestLayer = layerWith({
  "/source.txt": "link content",
})

it.effect("link creates a hard link with same content", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.link("/source.txt", "/hardlink.txt")
    const content = yield* fs.readFileString("/hardlink.txt")
    expect(content).toBe("link content")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("link nonexistent source returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.link("/nope.txt", "/any.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
