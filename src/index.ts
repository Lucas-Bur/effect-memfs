import { Effect, FileSystem, Layer } from "effect"

import { makeVol, type FileTree } from "./helpers/volume.js"
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

const makeFileSystem = (initialFiles: FileTree = {}): Effect.Effect<FileSystem.FileSystem> =>
  Effect.sync(() => {
    const vol = makeVol(initialFiles)
    return FileSystem.make({
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
  })

export const layer = (initialFiles: FileTree = {}): Layer.Layer<FileSystem.FileSystem> =>
  Layer.effect(FileSystem.FileSystem)(makeFileSystem(initialFiles))
