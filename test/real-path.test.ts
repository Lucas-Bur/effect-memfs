import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
  "/foo": "bar",
  "/dir": null,
})

it.effect("realPath resolves a file path", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* fs.realPath("/foo")
    expect(result).toBe("/foo")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("realPath resolves a directory path", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* fs.realPath("/dir")
    expect(result).toBe("/dir")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("realPath missing path returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.realPath("/missing"), "NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
