# @lucas-bur/effect-memfs

[![npm](https://img.shields.io/npm/v/@lucas-bur/effect-memfs)](https://www.npmjs.com/package/@lucas-bur/effect-memfs)
[![codecov](https://codecov.io/gh/lucas-bur/effect-memfs/branch/main/graph/badge.svg)](https://codecov.io/gh/lucas-bur/effect-memfs)

Platform-agnostic in-memory file system for [Effect](https://effect.website) v4. Everything is kept in RAM – no disk, no native bindings. Works in Node, browsers, edge runtimes, anywhere.

Ideal for testing, mocking, and scenarios where you need a filesystem but don't want to touch the real one. Exposes the standard `FileSystem` service so your Effect code doesn't know the difference.

## Install

```sh
npm install @lucas-bur/effect-memfs effect
```

## Usage

```ts
import { Effect, FileSystem } from "effect"
import * as MemoryFileSystem from "@lucas-bur/effect-memfs"

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  yield* fs.writeFileString("hello.txt", "world")
  return yield* fs.readFileString("hello.txt")
})

Effect.runPromise(program.pipe(Effect.provide(MemoryFileSystem.layer())))
// => "world"
```

Pre-populate files:

```ts
import { Effect, FileSystem } from "effect"
import { layer } from "@lucas-bur/effect-memfs"

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  return yield* fs.readFileString("/src/index.ts")
})

Effect.runPromise(
  program.pipe(
    Effect.provide(
      layer({
        src: {
          "index.ts": "export const x = 1",
          utils: { "math.ts": "export const add = (a, b) => a + b" },
        },
        test: {
          "foo.test.ts": "import { x } from '../src'",
        },
        assets: null, // empty directory
      }),
    ),
  ),
)
```

## License

MIT
