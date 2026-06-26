/**
 * Cross-validation suite for MemoryFileSystem.
 *
 * Runs the same tests against both MemoryFileSystem and NodeFileSystem to verify 1:1 behavioral
 * parity with the real filesystem.
 *
 * When a test fails only on one backend, that's a bug. Fix it, then add a dedicated regression test
 * covering that specific discrepancy so it stays caught forever.
 *
 * See CONTRIBUTING.md for conventions.
 */
import { NodeFileSystem } from "@effect/platform-node-shared"
import { describe, expect, it } from "@effect/vitest"
import { Effect, FileSystem, type Layer } from "effect"

import { layer } from "../src/index.js"
import { expectError } from "./helpers.js"

const fileSystemSuite = (layer: Layer.Layer<FileSystem.FileSystem>, name: string) => {
  describe(name, () => {
    it.effect("writeFileString + readFileString round-trip", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        const path = `${tmp}/cross.txt`
        yield* fs.writeFileString(path, "cross-test")
        const content = yield* fs.readFileString(path)
        expect(content).toBe("cross-test")
      }).pipe(Effect.provide(layer)),
    )

    it.effect("writeFile (binary) + readFile round-trip", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        const path = `${tmp}/cross.bin`
        const data = new TextEncoder().encode("binary")
        yield* fs.writeFile(path, data)
        const read = yield* fs.readFile(path)
        expect([...read]).toStrictEqual([...data])
      }).pipe(Effect.provide(layer)),
    )

    it.effect("exists returns true for existing file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        const path = `${tmp}/exists`
        yield* fs.writeFileString(path, "x")
        expect(yield* fs.exists(path)).toBe(true)
      }).pipe(Effect.provide(layer)),
    )

    it.effect("exists returns false for missing file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        expect(yield* fs.exists(`${tmp}/nope`)).toBe(false)
      }).pipe(Effect.provide(layer)),
    )

    it.effect("makeDirectory creates a directory", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* fs.makeDirectory(`${tmp}/crossdir`)
        const stat = yield* fs.stat(`${tmp}/crossdir`)
        expect(stat.type).toBe("Directory")
      }).pipe(Effect.provide(layer)),
    )

    it.effect("readDirectory lists entries", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* fs.writeFileString(`${tmp}/a.txt`, "a")
        yield* fs.writeFileString(`${tmp}/b.txt`, "b")
        yield* fs.makeDirectory(`${tmp}/sub`)
        const entries = yield* fs.readDirectory(tmp)
        expect(entries).toContain("a.txt")
        expect(entries).toContain("b.txt")
        expect(entries).toContain("sub")
      }).pipe(Effect.provide(layer)),
    )

    it.effect("remove deletes a file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        const path = `${tmp}/todelete`
        yield* fs.writeFileString(path, "x")
        yield* fs.remove(path)
        expect(yield* fs.exists(path)).toBe(false)
      }).pipe(Effect.provide(layer)),
    )

    it.effect("rename moves a file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* fs.writeFileString(`${tmp}/src.txt`, "move me")
        yield* fs.rename(`${tmp}/src.txt`, `${tmp}/dst.txt`)
        expect(yield* fs.readFileString(`${tmp}/dst.txt`)).toBe("move me")
        expect(yield* fs.exists(`${tmp}/src.txt`)).toBe(false)
      }).pipe(Effect.provide(layer)),
    )

    it.effect("copyFile duplicates content", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* fs.writeFileString(`${tmp}/original.txt`, "copy me")
        yield* fs.copyFile(`${tmp}/original.txt`, `${tmp}/duplicate.txt`)
        expect(yield* fs.readFileString(`${tmp}/duplicate.txt`)).toBe("copy me")
      }).pipe(Effect.provide(layer)),
    )

    it.effect("stat returns correct file size", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* fs.writeFileString(`${tmp}/sized.txt`, "12345")
        const info = yield* fs.stat(`${tmp}/sized.txt`)
        expect(info.size).toBe(FileSystem.Size(5))
      }).pipe(Effect.provide(layer)),
    )

    it.effect("truncate shortens a file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* fs.writeFileString(`${tmp}/trunc.txt`, "hello world")
        yield* fs.truncate(`${tmp}/trunc.txt`, 5)
        expect(yield* fs.readFileString(`${tmp}/trunc.txt`)).toBe("hello")
      }).pipe(Effect.provide(layer)),
    )

    it.effect("chmod changes mode", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* fs.writeFileString(`${tmp}/mod.txt`, "x")
        yield* fs.chmod(`${tmp}/mod.txt`, 0o644)
        const info = yield* fs.stat(`${tmp}/mod.txt`)
        expect(info.mode & 0o777).toBeGreaterThan(0)
      }).pipe(Effect.provide(layer)),
    )

    it.effect("access succeeds for existing file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* fs.writeFileString(`${tmp}/available.txt`, "x")
        yield* fs.access(`${tmp}/available.txt`)
      }).pipe(Effect.provide(layer)),
    )

    it.effect("readFile on missing file returns NotFound", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* expectError(fs.readFileString(`${tmp}/does-not-exist.txt`), "NotFound")
      }).pipe(Effect.provide(layer)),
    )

    it.effect("stat on missing file returns NotFound", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* expectError(fs.stat(`${tmp}/does-not-exist.txt`), "NotFound")
      }).pipe(Effect.provide(layer)),
    )

    it.effect("remove on missing file returns NotFound", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const tmp = yield* fs.makeTempDirectoryScoped()
        yield* expectError(fs.remove(`${tmp}/does-not-exist.txt`), "NotFound")
      }).pipe(Effect.provide(layer)),
    )
  })
}

fileSystemSuite(NodeFileSystem.layer, "NodeFileSystem")

fileSystemSuite(layer(), "MemoryFileSystem")
