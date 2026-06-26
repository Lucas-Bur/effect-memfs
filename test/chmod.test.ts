import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/file.txt": "content",
})

it.effect("chmod changes file mode", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.chmod("/file.txt", 0o755)
    const info = yield* fs.stat("/file.txt")
    expect(info.mode & 0o777).toBe(0o755)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("chmod nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.chmod("/nope.txt", 0o644))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
