import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/source.txt": "hello",
  "/dest.txt": "world",
})

it.effect("renames a file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.rename("/source.txt", "/moved.txt")
    const sourceExists = yield* fs.exists("/source.txt")
    const destExists = yield* fs.exists("/moved.txt")
    expect(sourceExists).toBe(false)
    expect(destExists).toBe(true)
    const content = yield* fs.readFileString("/moved.txt")
    expect(content).toBe("hello")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("rename overwrites existing destination", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.rename("/source.txt", "/dest.txt")
    const content = yield* fs.readFileString("/dest.txt")
    expect(content).toBe("hello")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("rename nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.rename("/nope.txt", "/whatever.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("rename directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/olddir")
    yield* fs.writeFileString("/olddir/file.txt", "inside")
    yield* fs.rename("/olddir", "/newdir")
    const oldExists = yield* fs.exists("/olddir")
    expect(oldExists).toBe(false)
    const content = yield* fs.readFileString("/newdir/file.txt")
    expect(content).toBe("inside")
  }).pipe(Effect.provide(TestLayer)),
)
