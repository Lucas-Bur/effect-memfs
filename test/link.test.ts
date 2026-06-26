import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
  "/source.txt": "link content",
})

it.effect("link creates a hard link with same content", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.link("/source.txt", "/hardlink.txt")
    const content = yield* fs.readFileString("/hardlink.txt")
    expect(content).toBe("link content")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("link nonexistent source returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.link("/nope.txt", "/any.txt"), "NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
