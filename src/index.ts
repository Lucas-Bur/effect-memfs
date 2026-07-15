import { Effect, FileSystem, Layer, type PlatformError } from "effect"
import type { Volume } from "memfs"

import {
  makeResolvePath,
  makeVol,
  makeVolFromFileSystem,
  type FileTree,
  type VolumeOptions,
} from "./helpers/volume.js"
import { access } from "./operations/access.js"
import { chmod } from "./operations/chmod.js"
import { chown } from "./operations/chown.js"
import { copyFile } from "./operations/copy-file.js"
import { copy } from "./operations/copy.js"
import { link } from "./operations/link.js"
import { makeDirectory } from "./operations/make-directory.js"
import { makeTempDirectory, makeTempDirectoryScoped } from "./operations/make-temp-directory.js"
import { makeTempFile, makeTempFileScoped } from "./operations/make-temp-file.js"
import { open } from "./operations/open.js"
import { readDirectory } from "./operations/read-directory.js"
import { readFile } from "./operations/read-file.js"
import { readLink } from "./operations/read-link.js"
import { realPath } from "./operations/real-path.js"
import { remove } from "./operations/remove.js"
import { rename } from "./operations/rename.js"
import { stat } from "./operations/stat.js"
import { symlink } from "./operations/symlink.js"
import { truncate } from "./operations/truncate.js"
import { utimes } from "./operations/utimes.js"
import { watch } from "./operations/watch.js"
import { writeFile } from "./operations/write-file.js"

export type LayerOptions = VolumeOptions
export { type FileTree }

// TODO(1:1-parity): memfs must be 1:1 interchangeable with NodeFileSystem — same
// behavior, same error tags, same edge cases. Enforce this via the cross-validation
// suite in `test/file-system-suite.test.ts`, which runs every case against both
// backends. Any divergence is a bug, not a platform quirk; fix it and add a
// regression test that pins the corrected behavior. Tracked at the project level
// because every operation in this module depends on it.

const makeFileSystem = (vol: Volume, cwd = "/"): FileSystem.FileSystem => {
  const resolvePath = makeResolvePath(cwd)
  return FileSystem.make({
    access: access(vol, resolvePath),
    chmod: chmod(vol, resolvePath),
    chown: chown(vol, resolvePath),
    copy: copy(vol, resolvePath),
    copyFile: copyFile(vol, resolvePath),
    link: link(vol, resolvePath),
    makeDirectory: makeDirectory(vol, resolvePath),
    makeTempDirectory: makeTempDirectory(vol, resolvePath),
    makeTempDirectoryScoped: makeTempDirectoryScoped(vol, resolvePath),
    makeTempFile: makeTempFile(vol, resolvePath),
    makeTempFileScoped: makeTempFileScoped(vol, resolvePath),
    open: open(vol, resolvePath),
    readDirectory: readDirectory(vol, resolvePath),
    readFile: readFile(vol, resolvePath),
    readLink: readLink(vol, resolvePath),
    realPath: realPath(vol, resolvePath),
    remove: remove(vol, resolvePath),
    rename: rename(vol, resolvePath),
    stat: stat(vol, resolvePath),
    symlink: symlink(vol, resolvePath),
    truncate: truncate(vol, resolvePath),
    utimes: utimes(vol, resolvePath),
    watch: watch(vol, resolvePath),
    writeFile: writeFile(vol, resolvePath),
  })
}

export const layer = (
  initialFiles: FileTree = {},
  options: LayerOptions = {},
): Layer.Layer<FileSystem.FileSystem> =>
  Layer.sync(FileSystem.FileSystem, () => {
    const cwd = options.cwd ?? "/"
    return makeFileSystem(makeVol(initialFiles, { cwd }), cwd)
  })

/**
 * Build a `FileSystem` layer pre-populated from a real directory.
 *
 * Walks `path` using the caller-provided `FileSystem.FileSystem` service (e.g.
 * `NodeFileSystem.layer`) and copies the entire tree — files, empty directories, symlinks, plus
 * mode, owner, and timestamps — into a fresh in-memory `Volume`. The in-memory `FileSystem` service
 * is then built on top of that `Volume`.
 *
 * The source path is mounted at the same path inside the in-memory filesystem; pass `mountAt` to
 * remap it.
 *
 * @example
 *   ;```ts
 *   import { NodeFileSystem } from "@effect/platform-node-shared"
 *   import { Effect, FileSystem } from "effect"
 *   import { layerFromPath } from "@lucas-bur/effect-memfs"
 *
 *   const program = Effect.gen(function* () {
 *     const fs = yield* FileSystem.FileSystem
 *     return yield* fs.readFileString("/data/fixtures/test.json")
 *   }).pipe(Effect.provide(layerFromPath("/data/fixtures")), Effect.provide(NodeFileSystem.layer))
 *   ```
 */
export const layerFromPath = (
  path: string,
  options?: { readonly mountAt?: string },
): Layer.Layer<FileSystem.FileSystem, PlatformError.PlatformError, FileSystem.FileSystem> =>
  Layer.unwrap(
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const vol = yield* makeVolFromFileSystem(fs, path, options)
      return Layer.succeed(FileSystem.FileSystem, makeFileSystem(vol))
    }),
  )
