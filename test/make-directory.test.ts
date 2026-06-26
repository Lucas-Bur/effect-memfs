import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/existing.txt": "file",
})

it.effect("creates a new directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/newdir")
    const stat = yield* fs.stat("/newdir")
    expect(stat.type).toBe("Directory")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("creates nested directory with recursive", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/a/b/c", { recursive: true })
    const stat = yield* fs.stat("/a/b/c")
    expect(stat.type).toBe("Directory")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeDirectory on existing dir returns AlreadyExists", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/existingdir")
    const result = yield* Effect.flip(fs.makeDirectory("/existingdir"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("AlreadyExists")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeDirectory recursive on existing dir succeeds", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/existingdir")
    yield* fs.makeDirectory("/existingdir", { recursive: true })
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeDirectory without recursive on missing parent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.makeDirectory("/missing/sub"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeDirectory with recursive creates parent directories", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/x/y/z", { recursive: true })
    const statX = yield* fs.stat("/x")
    const statY = yield* fs.stat("/x/y")
    expect(statX.type).toBe("Directory")
    expect(statY.type).toBe("Directory")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeDirectory on file returns AlreadyExists", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.makeDirectory("/existing.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("AlreadyExists")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeDirectory with mode sets directory permissions", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/modeled", { mode: 0o755 })
    const info = yield* fs.stat("/modeled")
    expect(info.mode & 0o777).toBe(0o755)
  }).pipe(Effect.provide(TestLayer)),
)
