import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer()

it.effect("makeTempDirectory creates a temporary directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const dir = yield* fs.makeTempDirectory()
    const exists = yield* fs.exists(dir)
    expect(exists).toBe(true)
    const stat = yield* fs.stat(dir)
    expect(stat.type).toBe("Directory")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempDirectory with prefix", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const dir = yield* fs.makeTempDirectory({ prefix: "myapp-" })
    expect(dir).toContain("/myapp-")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempDirectory with directory option", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const dir = yield* fs.makeTempDirectory({ directory: "/custom" })
    expect(dir).toContain("/custom")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempDirectoryScoped removes after scope", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const dir = yield* Effect.scoped(
      Effect.gen(function* () {
        const d = yield* fs.makeTempDirectoryScoped({ prefix: "test-" })
        yield* fs.writeFileString(d + "/a.txt", "content")
        const e = yield* fs.exists(d)
        expect(e).toBe(true)
        return d
      }),
    )
    const exists = yield* fs.exists(dir)
    expect(exists).toBe(false)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempDirectoryScoped with directory option", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const dir = yield* Effect.scoped(fs.makeTempDirectoryScoped({ directory: "/tmp" }))
    expect(dir).toContain("/tmp")
    const exists = yield* fs.exists(dir)
    expect(exists).toBe(false)
  }).pipe(Effect.provide(TestLayer)),
)
