import { it } from "@effect/vitest"
import { Effect, Exit, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer()

it.effect("makeTempFile creates a temporary file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const file = yield* fs.makeTempFile()
    const exists = yield* fs.exists(file)
    expect(exists).toBe(true)
    const stat = yield* fs.stat(file)
    expect(stat.type).toBe("File")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempFile with suffix", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const file = yield* fs.makeTempFile({ suffix: ".txt" })
    expect(file.endsWith(".txt")).toBe(true)
    const exists = yield* fs.exists(file)
    expect(exists).toBe(true)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempFile with prefix", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const file = yield* fs.makeTempFile({ prefix: "myprefix-" })
    expect(file.includes("myprefix-")).toBe(true)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempFile in custom directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory("/custom-temp")
    const file = yield* fs.makeTempFile({ directory: "/custom-temp" })
    expect(file.startsWith("/custom-temp/")).toBe(true)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempFileScoped removes after scope", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const file = yield* Effect.scoped(
      Effect.gen(function* () {
        const f = yield* fs.makeTempFileScoped({ suffix: ".tmp" })
        const e = yield* fs.exists(f)
        expect(e).toBe(true)
        return f
      }),
    )
    const exists = yield* fs.exists(file)
    expect(exists).toBe(false)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("makeTempFileScoped defects when parent dir is manually removed", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const exit = yield* Effect.exit(
      Effect.scoped(
        Effect.gen(function* () {
          const file = yield* fs.makeTempFileScoped()
          yield* fs.remove(file.slice(0, file.lastIndexOf("/")), { recursive: true })
        }),
      ),
    )
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause.reasons[0]._tag).toBe("Die")
    }
  }).pipe(Effect.provide(TestLayer)),
)
