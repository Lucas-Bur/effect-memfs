import { NodeFileSystem } from "@effect/platform-node-shared"
import { it } from "@effect/vitest"
import { Effect, FileSystem } from "effect"

import { makeVolFromFileSystem } from "../src/helpers/volume.js"
import { layerFromPath } from "../src/index.js"

const provideNode = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(Effect.provide(NodeFileSystem.layer))

const setupFixture = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const tmp = yield* fs.makeTempDirectoryScoped()
  yield* fs.writeFileString(`${tmp}/hello.txt`, "world")
  yield* fs.makeDirectory(`${tmp}/nested`)
  yield* fs.writeFileString(`${tmp}/nested/data.json`, `{"x":1}`)
  yield* fs.writeFileString(`${tmp}/nested/empty`, "")
  return tmp
})

it.effect("replicates file contents", () =>
  Effect.gen(function* () {
    const tmp = yield* setupFixture
    const fs = yield* FileSystem.FileSystem
    const vol = yield* makeVolFromFileSystem(fs, tmp)
    expect(vol.readFileSync(`${tmp}/hello.txt`, "utf8")).toBe("world")
    expect(vol.readFileSync(`${tmp}/nested/data.json`, "utf8")).toBe(`{"x":1}`)
  }).pipe(provideNode),
)

it.effect("replicates empty directories", () =>
  Effect.gen(function* () {
    const tmp = yield* setupFixture
    const fs = yield* FileSystem.FileSystem
    const vol = yield* makeVolFromFileSystem(fs, tmp)
    expect(vol.statSync(`${tmp}/nested`).isDirectory()).toBe(true)
    expect(vol.readdirSync(`${tmp}/nested`)).toContain("data.json")
  }).pipe(provideNode),
)

it.effect("replicates symlinks without following them", () =>
  Effect.gen(function* () {
    if (process.platform === "win32") return
    const fs = yield* FileSystem.FileSystem
    const tmp = yield* fs.makeTempDirectoryScoped()
    yield* fs.writeFileString(`${tmp}/target.txt`, "real")
    yield* fs.symlink(`${tmp}/target.txt`, `${tmp}/link.txt`)
    const vol = yield* makeVolFromFileSystem(fs, tmp)
    expect(vol.lstatSync(`${tmp}/link.txt`).isSymbolicLink()).toBe(true)
    expect(vol.readlinkSync(`${tmp}/link.txt`)).toBe(`${tmp}/target.txt`)
  }).pipe(provideNode),
)

it.effect("replicates file mode", () =>
  Effect.gen(function* () {
    if (process.platform === "win32") return
    const fs = yield* FileSystem.FileSystem
    const tmp = yield* fs.makeTempDirectoryScoped()
    yield* fs.writeFileString(`${tmp}/script.sh`, "#!/bin/sh")
    yield* fs.chmod(`${tmp}/script.sh`, 0o755)
    const vol = yield* makeVolFromFileSystem(fs, tmp)
    expect(vol.statSync(`${tmp}/script.sh`).mode & 0o777).toBe(0o755)
  }).pipe(provideNode),
)

it.effect("supports remapping with mountAt", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const tmp = yield* fs.makeTempDirectoryScoped()
    yield* fs.writeFileString(`${tmp}/a.txt`, "A")
    const vol = yield* makeVolFromFileSystem(fs, tmp, { mountAt: "/app" })
    expect(vol.readFileSync(`/app/a.txt`, "utf8")).toBe("A")
    expect(vol.existsSync(`${tmp}/a.txt`)).toBe(false)
  }).pipe(provideNode),
)

it.effect("mountAt accepts a relative path (lands at /<name>, not under CWD)", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const tmp = yield* fs.makeTempDirectoryScoped()
    yield* fs.writeFileString(`${tmp}/a.txt`, "A")
    const vol = yield* makeVolFromFileSystem(fs, tmp, { mountAt: "app" })
    expect(vol.readFileSync(`/app/a.txt`, "utf8")).toBe("A")
    expect(vol.readdirSync(`/`).sort()).toStrictEqual(["app"])
  }).pipe(provideNode),
)

it.effect("replicates into read-only source directories (e.g. .git/objects)", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const tmp = yield* fs.makeTempDirectoryScoped()
    yield* fs.makeDirectory(`${tmp}/ro`)
    yield* fs.writeFileString(`${tmp}/ro/loose-object`, "blob")
    yield* fs.chmod(`${tmp}/ro`, 0o444)
    const vol = yield* makeVolFromFileSystem(fs, tmp).pipe(
      Effect.ensuring(Effect.ignore(fs.chmod(`${tmp}/ro`, 0o755))),
    )
    expect(vol.readFileSync(`${tmp}/ro/loose-object`, "utf8")).toBe("blob")
  }).pipe(provideNode),
)

it.effect("replicates read-only source files (e.g. git object blobs at 0o444)", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const tmp = yield* fs.makeTempDirectoryScoped()
    yield* fs.writeFileString(`${tmp}/blob`, "data")
    yield* fs.chmod(`${tmp}/blob`, 0o444)
    const vol = yield* makeVolFromFileSystem(fs, tmp)
    expect(vol.readFileSync(`${tmp}/blob`, "utf8")).toBe("data")
    if (process.platform !== "win32") {
      expect(vol.statSync(`${tmp}/blob`).mode & 0o777).toBe(0o444)
    }
  }).pipe(provideNode),
)

it.effect("layerFromPath exposes a working in-memory FileSystem", () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const tmp = yield* fs.makeTempDirectoryScoped()
    yield* fs.writeFileString(`${tmp}/greeting.txt`, "hi")
    const content = yield* Effect.gen(function* () {
      const memFs = yield* FileSystem.FileSystem
      return yield* memFs.readFileString(`${tmp}/greeting.txt`)
    }).pipe(Effect.provide(layerFromPath(tmp)), Effect.provide(NodeFileSystem.layer))
    expect(content).toBe("hi")
  }).pipe(provideNode),
)
