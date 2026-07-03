import { Effect, FileSystem, Layer, type PlatformError } from "effect"
import type { Volume } from "memfs"

import { makeVol, makeVolFromFileSystem, type FileTree } from "./helpers/volume.js"
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

export { type FileTree }

// TODO(1:1-parity): memfs must be 1:1 interchangeable with NodeFileSystem — same
// behavior, same error tags, same edge cases. Enforce this via the cross-validation
// suite in `test/file-system-suite.test.ts`, which runs every case against both
// backends. Any divergence is a bug, not a platform quirk; fix it and add a
// regression test that pins the corrected behavior. Tracked at the project level
// because every operation in this module depends on it.

const makeFileSystem = (vol: Volume): FileSystem.FileSystem =>
  FileSystem.make({
    access: access(vol),
    chmod: chmod(vol),
    chown: chown(vol),
    copy: copy(vol),
    copyFile: copyFile(vol),
    link: link(vol),
    makeDirectory: makeDirectory(vol),
    makeTempDirectory: makeTempDirectory(vol),
    makeTempDirectoryScoped: makeTempDirectoryScoped(vol),
    makeTempFile: makeTempFile(vol),
    makeTempFileScoped: makeTempFileScoped(vol),
    open: open(vol),
    readDirectory: readDirectory(vol),
    readFile: readFile(vol),
    readLink: readLink(vol),
    realPath: realPath(vol),
    remove: remove(vol),
    rename: rename(vol),
    stat: stat(vol),
    symlink: symlink(vol),
    truncate: truncate(vol),
    utimes: utimes(vol),
    watch: watch(vol),
    writeFile: writeFile(vol),
  })

export const layer = (initialFiles: FileTree = {}): Layer.Layer<FileSystem.FileSystem> =>
  Layer.sync(FileSystem.FileSystem, () => makeFileSystem(makeVol(initialFiles)))

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
 *   ```ts
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
