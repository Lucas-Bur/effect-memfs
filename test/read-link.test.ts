import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
  "/target": "link me",
})

it.effect("readLink resolves symlink target", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.symlink("/target", "/link")
    const target = yield* fs.readLink("/link")
    expect(target).toBe("/target")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readLink on non-symlink returns InvalidData", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.readLink("/target"), "InvalidData")
  }).pipe(Effect.provide(TestLayer)),
)
