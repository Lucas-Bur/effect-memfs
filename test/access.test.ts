import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/hello.txt": "Hello",
  "/dir": null,
})

it.effect("access existing file succeeds", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.access("/hello.txt")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("access existing file passes with { ok: true }", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.access("/hello.txt", { ok: true })
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("access existing file passes with { readable: true }", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.access("/hello.txt", { readable: true })
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("access existing file passes with { writable: true }", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.access("/hello.txt", { writable: true })
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("access existing file passes with all options combined", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.access("/hello.txt", { ok: true, readable: true, writable: true })
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("access existing file passes with empty options object {}", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.access("/hello.txt", {})
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("access on directory succeeds", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.access("/dir")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("access nonexistent file returns PlatformError(NotFound)", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.access("/nope.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("access nonexistent file with options also returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.access("/nope.txt", { readable: true }))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

// Integration: Effect's default exists() delegates to access() internally.
// See FileSystem.ts:770 â€” Effect.map(access(path), â€¦)
it.effect("[integration via access] exists returns true for existing file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const yes = yield* fs.exists("/hello.txt")
    expect(yes).toBe(true)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("[integration via access] exists returns false for missing file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const no = yield* fs.exists("/nope.txt")
    expect(no).toBe(false)
  }).pipe(Effect.provide(TestLayer)),
)
