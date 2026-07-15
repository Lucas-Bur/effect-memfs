import { expect, it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { layer } from "../src/index.js"

const TestLayer = layer({
  project: {
    "config.json": "configured",
  },
  "rename-source.txt": "rename",
  "copy-source.txt": "copy",
  "link-source.txt": "link",
  links: {
    "target.txt": "target",
  },
})

it.effect("reads initialized files through relative and absolute paths", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    expect(yield* fs.readFileString("project/config.json")).toBe("configured")
    expect(yield* fs.readFileString("/project/config.json")).toBe("configured")
    expect(yield* fs.readDirectory(".")).toContain("project")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("writes and opens files relative to the virtual root", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    yield* fs.writeFileString("written.txt", "written")
    expect(yield* fs.readFileString("/written.txt")).toBe("written")

    const file = yield* fs.open("opened.txt", { flag: "w+" })
    yield* file.writeAll(new TextEncoder().encode("opened"))
    expect(yield* fs.readFileString("/opened.txt")).toBe("opened")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("resolves both paths for rename, copy, and link", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    yield* fs.rename("rename-source.txt", "renamed.txt")
    yield* fs.copy("copy-source.txt", "copied.txt")
    yield* fs.link("link-source.txt", "linked.txt")

    expect(yield* fs.readFileString("/renamed.txt")).toBe("rename")
    expect(yield* fs.readFileString("/copied.txt")).toBe("copy")
    expect(yield* fs.readFileString("/linked.txt")).toBe("link")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("keeps relative symlink targets relative to the link directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    yield* fs.symlink("target.txt", "links/link.txt")

    expect(yield* fs.readLink("/links/link.txt")).toBe("target.txt")
    expect(yield* fs.readFileString("links/link.txt")).toBe("target")
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("creates temporary entries in relative directories", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    yield* fs.makeDirectory("temp")
    const directory = yield* fs.makeTempDirectory({ directory: "temp", prefix: "dir-" })
    const file = yield* fs.makeTempFile({ directory: "temp", prefix: "file-" })

    expect((yield* fs.stat(directory)).type).toBe("Directory")
    expect((yield* fs.stat(file)).type).toBe("File")
    expect(directory.startsWith("/temp/dir-")).toBe(true)
    expect(file.startsWith("/temp/file-")).toBe(true)
  }).pipe(Effect.provide(TestLayer)),
)

it.effect("supports a configurable working directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    expect(yield* fs.readFileString("project/config.json")).toBe("configured")
    expect(yield* fs.readFileString("/workspace/project/config.json")).toBe("configured")
    expect(yield* fs.exists("/project/config.json")).toBe(false)
  }).pipe(
    Effect.provide(
      layer(
        {
          project: {
            "config.json": "configured",
          },
        },
        { cwd: "/workspace" },
      ),
    ),
  ),
)

it.effect("can mirror the Node process working directory", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const absolute = process.cwd().replace(/\\/g, "/") + "/project/config.json"

    expect(yield* fs.readFileString("project/config.json")).toBe("configured")
    expect(yield* fs.readFileString(absolute)).toBe("configured")
  }).pipe(
    Effect.provide(
      layer(
        {
          project: {
            "config.json": "configured",
          },
        },
        { cwd: process.cwd() },
      ),
    ),
  ),
)
