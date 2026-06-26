import { it } from "@effect/vitest"
import { Effect, FileSystem, Option } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  "/file.txt": "Hello, World!",
})

const TestLayerEmpty = layer()

it.effect("opens a file for reading", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/file.txt")
    const buf = new Uint8Array(5)
    const bytes = yield* fh.read(buf)
    expect(bytes).toBe(FileSystem.Size(5))
    expect(new TextDecoder().decode(buf)).toBe("Hello")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("reads entire file through handle", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/file.txt")
    const buf = new Uint8Array(100)
    const bytes = yield* fh.read(buf)
    expect(bytes).toBe(FileSystem.Size(13))
    expect(new TextDecoder().decode(buf.subarray(0, 13))).toBe("Hello, World!")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readAlloc returns chunks", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/file.txt")
    const chunk1 = yield* fh.readAlloc(5)
    expect(chunk1._tag).toBe("Some")
    expect(new TextDecoder().decode(Option.getOrElse(chunk1, () => new Uint8Array()))).toBe("Hello")
    const chunk2 = yield* fh.readAlloc(100)
    expect(chunk2._tag).toBe("Some")
    expect(new TextDecoder().decode(Option.getOrElse(chunk2, () => new Uint8Array()))).toBe(
      ", World!",
    )
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("readAlloc at end returns None", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/file.txt")
    yield* fh.seek(FileSystem.Size(13), "start")
    const chunk = yield* fh.readAlloc(5)
    expect(chunk._tag).toBe("None")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("opens a file for writing", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/new.txt", { flag: "w" })
    const data = new TextEncoder().encode("written")
    yield* fh.writeAll(data)
    const content = yield* fs.readFileString("/new.txt")
    expect(content).toBe("written")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("write with append flag", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/file.txt", { flag: "a" })
    yield* fh.writeAll(new TextEncoder().encode("!!"))
    const content = yield* fs.readFileString("/file.txt")
    expect(content).toBe("Hello, World!!!")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("seek positions correctly", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/file.txt")
    yield* fh.seek(FileSystem.Size(7), "start")
    const buf = new Uint8Array(5)
    yield* fh.read(buf)
    expect(new TextDecoder().decode(buf)).toBe("World")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("stat through file handle", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/file.txt")
    const info = yield* fh.stat
    expect(info.type).toBe("File")
    expect(info.size).toBe(FileSystem.Size(13))
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("truncate through file handle", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/file.txt", { flag: "r+" })
    yield* fh.truncate(5)
    const content = yield* fs.readFileString("/file.txt")
    expect(content).toBe("Hello")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("open nonexistent returns NotFound", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const result = yield* Effect.flip(fs.open("/nope.txt"))
    expect(result._tag).toBe("PlatformError")
    expect(result.reason._tag).toBe("NotFound")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("tracks cursor position when writing with seek and overwrite", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/write-seek.txt", { flag: "w+" })

    yield* fh.write(new TextEncoder().encode("lorem ipsum"))
    yield* fh.write(new TextEncoder().encode(" "))
    yield* fh.write(new TextEncoder().encode("dolor sit amet"))
    let text = yield* fs.readFileString("/write-seek.txt")
    expect(text).toBe("lorem ipsum dolor sit amet")

    yield* fh.seek(FileSystem.Size(-4), "current")
    yield* fh.write(new TextEncoder().encode("hello world"))
    text = yield* fs.readFileString("/write-seek.txt")
    expect(text).toBe("lorem ipsum dolor sit hello world")

    yield* fh.seek(FileSystem.Size(6), "start")
    yield* fh.write(new TextEncoder().encode("blabl"))
    text = yield* fs.readFileString("/write-seek.txt")
    expect(text).toBe("lorem blabl dolor sit hello world")
  }).pipe(Effect.provide(TestLayerEmpty)),
)

it.effect("maintains read cursor in append mode (a+)", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/append-read.txt", { flag: "a+" })

    yield* fh.write(new TextEncoder().encode("foo"))
    yield* fh.seek(FileSystem.Size(0), "start")

    yield* fh.write(new TextEncoder().encode("bar"))
    let text = yield* fs.readFileString("/append-read.txt")
    expect(text).toBe("foobar")

    const chunk1 = yield* fh.readAlloc(3)
    expect(chunk1._tag).toBe("Some")
    expect(new TextDecoder().decode(Option.getOrElse(chunk1, () => new Uint8Array()))).toBe("foo")

    yield* fh.write(new TextEncoder().encode("baz"))
    text = yield* fs.readFileString("/append-read.txt")
    expect(text).toBe("foobarbaz")

    const chunk2 = yield* fh.readAlloc(6)
    expect(chunk2._tag).toBe("Some")
    expect(new TextDecoder().decode(Option.getOrElse(chunk2, () => new Uint8Array()))).toBe(
      "barbaz",
    )
  }).pipe(Effect.provide(TestLayerEmpty)),
)

it.effect("clamps cursor when truncating below it", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/trunc-clamp.txt", { flag: "w+" })

    yield* fh.write(new TextEncoder().encode("lorem ipsum dolor sit amet"))
    yield* fh.truncate(FileSystem.Size(11))

    const cursor = yield* fh.seek(FileSystem.Size(0), "current")
    expect(cursor).toBe(FileSystem.Size(11))
  }).pipe(Effect.provide(TestLayerEmpty)),
)

it.effect("keeps cursor when truncating above it", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const fh = yield* fs.open("/trunc-keep.txt", { flag: "w+" })

    yield* fh.write(new TextEncoder().encode("lorem ipsum dolor sit amet"))
    yield* fh.seek(FileSystem.Size(6), "start")
    yield* fh.truncate(FileSystem.Size(11))

    const cursor = yield* fh.seek(FileSystem.Size(0), "current")
    expect(cursor).toBe(FileSystem.Size(6))
  }).pipe(Effect.provide(TestLayerEmpty)),
)
