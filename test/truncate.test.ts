import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
  "/file.txt": "Hello, World!",
})

it.effect("truncates a file to smaller size", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.truncate("/file.txt", 5)
    const content = yield* fs.readFileString("/file.txt")
    expect(content).toBe("Hello")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("truncates a file to zero", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.truncate("/file.txt", 0)
    const content = yield* fs.readFileString("/file.txt")
    expect(content).toBe("")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("truncate without length defaults to zero", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.truncate("/file.txt")
    const content = yield* fs.readFileString("/file.txt")
    expect(content).toBe("")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("truncate to larger size pads with null bytes", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.truncate("/file.txt", 20)
    const content = yield* fs.readFile("/file.txt")
    expect(content.length).toBe(20)
    expect(new TextDecoder().decode(content.subarray(0, 13))).toBe("Hello, World!")
    expect([...content.subarray(13)]).toStrictEqual(new Array(7).fill(0))
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("truncate nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.truncate("/nope.txt"), "NotFound")
  }).pipe(Effect.provide(TestLayer)),
)
