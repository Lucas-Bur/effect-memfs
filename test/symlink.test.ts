import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layerWith } from "../src/index.js"

const TestLayer = layerWith({
  "/target": "link me",
})

it.effect("symlink creates a symbolic link", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.symlink("/target", "/link")
    const target = yield* fs.readLink("/link")
    expect(target).toBe("/target")
  }).pipe(Effect.provide(TestLayer)),
)
