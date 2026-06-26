import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
  "/hello.txt": "Hello, World!",
  "/nested/file.md": "# Markdown",
})

it.effect("reads a text file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const content = yield* fs.readFileString("/hello.txt")
    expect(content).toBe("Hello, World!")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("reads a nested file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const content = yield* fs.readFileString("/nested/file.md")
    expect(content).toBe("# Markdown")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readFile returns Uint8Array", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const data = yield* fs.readFile("/hello.txt")
    expect(data).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(data)).toBe("Hello, World!")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readFile on directory returns BadResource", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.readFile("/nested"), "BadResource")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readFile on nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.readFile("/does-not-exist.txt"), "NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readFileString on nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.readFileString("/missing.txt"), "NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("reads empty file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const content = yield* fs.readFileString("/empty.txt")
    expect(content).toBe("")
  }).pipe(Effect.provide(layer({ "/empty.txt": "" }))),
)
