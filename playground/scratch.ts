import { NodeFileSystem, NodeRuntime } from "@effect/platform-node-shared"
import { Console, Effect, FileSystem } from "effect"

import { layerFromPath } from "../dist/index.mjs"

// it.effect("scratch: write + read roundtrip", () =>
//   Effect.gen(function* () {
//     const fs = yield* FileSystem.FileSystem

//     yield* fs.makeDirectory("/scratch")
//     yield* fs.writeFileString("/scratch/hello.txt", "world")
//     const content = yield* fs.readFileString("/scratch/hello.txt")
//     yield* Console.log(`read back: ${content}`)

//     expect(content).toBe("world")
//   }).pipe(Effect.provide(layer())),
// )

// it.effect("scratch: layer pre-populates files", () =>
//   Effect.gen(function* () {
//     const fs = yield* FileSystem.FileSystem

//     const a = yield* fs.readFileString("/a.txt")
//     const b = yield* fs.readFileString("/nested/b.txt")

//     expect(a).toBe("A")
//     expect(b).toBe("B")
//   }).pipe(
//     Effect.provide(
//       layer({
//         "/a.txt": "A",
//         "/nested/b.txt": "B",
//       }),
//     ),
//   ),
// )

const main = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const dir = yield* fs.readDirectory("/", { recursive: true })
  yield* Console.log(dir)
  for (let i = 0; i < dir.length; i++) {
    yield* Console.log(yield* fs.stat("/" + dir[i]))
  }

  // yield* Console.log(fs)
}).pipe(
  Effect.provide(layerFromPath("./test/../test", { mountAt: "app" })),
  Effect.provide(NodeFileSystem.layer),
)

NodeRuntime.runMain(main)
