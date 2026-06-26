import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
  "/file.txt": "content",
  "/dir/a.txt": "a",
  "/dir/sub/b.txt": "b",
})

it.effect("removes a file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.remove("/file.txt")
    const exists = yield* fs.exists("/file.txt")
    expect(exists).toBe(false)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("removes empty directory with recursive", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/emptydir")
    yield* fs.remove("/emptydir", { recursive: true })
    const exists = yield* fs.exists("/emptydir")
    expect(exists).toBe(false)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("removes directory tree with recursive", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.remove("/dir", { recursive: true })
    const exists = yield* fs.exists("/dir")
    expect(exists).toBe(false)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("remove non-empty directory without recursive returns BadResource", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.remove("/dir"), "BadResource")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("remove nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.remove("/nope.txt"), "NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("remove nonexistent with force succeeds", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.remove("/nope.txt", { force: true })
  }).pipe(Effect.provide(TestLayer)),
)
