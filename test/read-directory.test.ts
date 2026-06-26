import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/a.txt": "a",
  "/b.txt": "b",
  "/sub/c.txt": "c",
  "/sub/deep/d.txt": "d",
})

it.effect("lists root directory entries", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory("/")
    expect(entries).toContain("a.txt")
    expect(entries).toContain("b.txt")
    expect(entries).toContain("sub")
    expect(entries).not.toContain("c.txt")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("lists subdirectory entries", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory("/sub")
    expect(entries).toContain("c.txt")
    expect(entries).toContain("deep")
    expect(entries).not.toContain("d.txt")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("recursive readDirectory returns full paths", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory("/", { recursive: true })
    expect(entries).toContain("a.txt")
    expect(entries).toContain("sub/c.txt")
    expect(entries).toContain("sub/deep/d.txt")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("non-recursive entries have no leading slash", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory("/")
    for (const e of entries) {
      expect(e.startsWith("/")).toBe(false)
    }
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("recursive entries have no leading slash", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory("/", { recursive: true })
    for (const e of entries) {
      expect(e.startsWith("/")).toBe(false)
    }
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("recursive from subdir returns paths relative to subdir", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory("/sub", { recursive: true })
    expect(entries).toContain("c.txt")
    expect(entries).toContain("deep/d.txt")
    expect(entries).not.toContain("sub/c.txt")
    expect(entries).not.toContain("/sub/c.txt")
    for (const e of entries) {
      expect(e.startsWith("/")).toBe(false)
    }
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readDirectory on file returns BadResource", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.readDirectory("/a.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("BadResource")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readDirectory on nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.readDirectory("/nonexistent"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readDirectory on empty directory returns empty list", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/emptydir")
    const entries = yield* fs.readDirectory("/emptydir")
    expect(entries).toStrictEqual([])
  }).pipe(Effect.provide(TestLayer)),
)
