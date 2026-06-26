import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

it.effect("layer provides empty filesystem", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory("/")
    expect(entries).toStrictEqual([])
  }).pipe(Effect.provide(layer())),
)

it.effect("layer populates filesystem", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const content = yield* fs.readFileString("/hello.txt")
    expect(content).toBe("World")
  }).pipe(Effect.provide(layer({ "/hello.txt": "World" }))),
)

it.effect("layer creates independent state per provide", () =>
  Effect.gen(function* () {
    const program1 = Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      yield* fs.writeFileString("/x.txt", "modified")
      return yield* fs.readFileString("/x.txt")
    }).pipe(Effect.provide(layer({ "/x.txt": "1" })))

    const program2 = Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      return yield* fs.readFileString("/x.txt")
    }).pipe(Effect.provide(layer({ "/x.txt": "1" })))

    const result1 = yield* program1
    const result2 = yield* program2
    expect(result1).toBe("modified")
    expect(result2).toBe("1")
  }),
)
