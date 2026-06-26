import { expect, it } from "@effect/vitest"
import { Effect, FileSystem, Option } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
  "/file.txt": "content",
})

it.effect("chown changes file uid and gid", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.chown("/file.txt", 1000, 100)
    const info = yield* fs.stat("/file.txt")
    expect(Option.getOrThrow(info.uid)).toBe(1000)
    expect(Option.getOrThrow(info.gid)).toBe(100)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("chown nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.chown("/nope.txt", 1000, 100), "NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
