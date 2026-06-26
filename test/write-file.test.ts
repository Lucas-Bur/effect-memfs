import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const TestLayer = layer({
  "/existing.txt": "original",
})

it.effect("writes a new file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.writeFileString("/new.txt", "fresh")
    const content = yield* fs.readFileString("/new.txt")
    expect(content).toBe("fresh")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("overwrites an existing file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.writeFileString("/existing.txt", "overwritten")
    const content = yield* fs.readFileString("/existing.txt")
    expect(content).toBe("overwritten")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("writeFile with Uint8Array", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const data = new TextEncoder().encode("binary data")
    yield* fs.writeFile("/binary.bin", data)
    const read = yield* fs.readFile("/binary.bin")
    expect([...read]).toStrictEqual([...data])
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("writeFileString with empty string", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.writeFileString("/empty.txt", "")
    const content = yield* fs.readFileString("/empty.txt")
    expect(content).toBe("")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("writeFile with flag: a appends to existing file", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.writeFileString("/existing.txt", "hello", { flag: "a" })
    const content = yield* fs.readFileString("/existing.txt")
    expect(content).toBe("originalhello")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("writeFile with flag: wx fails if file exists", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* expectError(fs.writeFileString("/existing.txt", "nope", { flag: "wx" }), "AlreadyExists")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("writeFile with mode option sets permissions", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.writeFileString("/moded.txt", "mode test", { mode: 0o644 })
    const stat = yield* fs.stat("/moded.txt")
    expect(stat.mode & 0o777).toBe(0o644)
  }).pipe(Effect.provide(TestLayer)),
)
