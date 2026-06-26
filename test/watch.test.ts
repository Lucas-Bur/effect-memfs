import { expect, it } from "@effect/vitest"
import { Effect, FileSystem, Stream } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/dir/file.txt": "original",
  "/other.txt": "data",
})

it.effect("watch returns a Stream (no crash)", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const stream = fs.watch("/")
    expect(stream).toBeDefined()
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("watch on nonexistent path fails with NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(Effect.scoped(Stream.runCollect(fs.watch("/nope"))))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("watch emits Update on file change", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const events = yield* Effect.promise(
      () =>
        new Promise<readonly FileSystem.WatchEvent[]>((resolve) => {
          Effect.runPromise(
            Effect.scoped(Stream.runCollect(fs.watch("/").pipe(Stream.take(1)))),
          ).then(resolve)
          setTimeout(() => {
            Effect.runPromise(fs.writeFileString("/dir/file.txt", "modified"))
          }, 10)
        }),
    )
    expect(events.length).toBe(1)
    expect(events[0]._tag).toBe("Update")
    expect(events[0].path).toBe("dir/file.txt")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("watch emits Create on directory creation", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const events = yield* Effect.promise(
      () =>
        new Promise<readonly FileSystem.WatchEvent[]>((resolve) => {
          Effect.runPromise(
            Effect.scoped(Stream.runCollect(fs.watch("/").pipe(Stream.take(1)))),
          ).then(resolve)
          setTimeout(() => {
            Effect.runPromise(fs.makeDirectory("/newdir"))
          }, 10)
        }),
    )
    expect(events.length).toBe(1)
    expect(events[0]._tag).toBe("Create")
    expect(events[0].path).toBe("newdir")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("watch emits Remove on file deletion", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const events = yield* Effect.promise(
      () =>
        new Promise<readonly FileSystem.WatchEvent[]>((resolve) => {
          Effect.runPromise(
            Effect.scoped(Stream.runCollect(fs.watch("/").pipe(Stream.take(1)))),
          ).then(resolve)
          setTimeout(() => {
            Effect.runPromise(fs.remove("/other.txt"))
          }, 10)
        }),
    )
    expect(events.length).toBe(1)
    expect(events[0]._tag).toBe("Remove")
    expect(events[0].path).toBe("other.txt")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("watch on subdirectory emits events", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const events = yield* Effect.promise(
      () =>
        new Promise<readonly FileSystem.WatchEvent[]>((resolve) => {
          Effect.runPromise(
            Effect.scoped(Stream.runCollect(fs.watch("/dir").pipe(Stream.take(1)))),
          ).then(resolve)
          setTimeout(() => {
            Effect.runPromise(fs.writeFileString("/dir/file.txt", "modified"))
          }, 10)
        }),
    )
    expect(events.length).toBe(1)
    expect(events[0]._tag).toBe("Update")
    expect(events[0].path).toBe("file.txt")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("watch emits both Create and Remove via rename", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const events = yield* Effect.promise(
      () =>
        new Promise<readonly FileSystem.WatchEvent[]>((resolve) => {
          Effect.runPromise(
            Effect.scoped(Stream.runCollect(fs.watch("/").pipe(Stream.take(2)))),
          ).then(resolve)
          setTimeout(() => {
            Effect.runPromise(
              Effect.gen(function* () {
                yield* fs.makeDirectory("/newdir")
                yield* fs.remove("/other.txt")
              }),
            )
          }, 10)
        }),
    )
    const tags = events.map((e: FileSystem.WatchEvent) => e._tag)
    expect(tags).toContain("Create")
    expect(tags).toContain("Remove")
  }).pipe(Effect.provide(TestLayer)),
)

// events stop after scope release is hard to test without forking;
// the implementation uses Effect.acquireRelease which guarantees cleanup.
