import { Effect, Option, type FileSystem, type PlatformError } from "effect"
import { Volume } from "memfs"

import { fromSync } from "./promise.js"

export interface FileTree {
  [key: string]: string | null | FileTree
}

export const makeVol = (initialFiles: FileTree = {}): Volume =>
  Volume.fromNestedJSON(initialFiles, "/")

const copyMode = (vol: Volume, dst: string, info: FileSystem.File.Info, isLink: boolean): void => {
  const mode = info.mode & 0o777
  if (isLink) {
    vol.lchmodSync(dst, mode)
  } else {
    vol.chmodSync(dst, mode)
  }
}

const copyOwner = (vol: Volume, dst: string, info: FileSystem.File.Info, isLink: boolean): void => {
  const uid = Option.getOrUndefined(info.uid)
  const gid = Option.getOrUndefined(info.gid)
  if (uid === undefined || gid === undefined) return
  if (isLink) {
    vol.lchownSync(dst, uid, gid)
  } else {
    vol.chownSync(dst, uid, gid)
  }
}

const copyTimestamps = (
  vol: Volume,
  dst: string,
  info: FileSystem.File.Info,
  isLink: boolean,
): void => {
  const atime = Option.getOrUndefined(info.atime)
  const mtime = Option.getOrUndefined(info.mtime)
  if (atime === undefined || mtime === undefined) return
  if (isLink) {
    vol.lutimesSync(dst, atime, mtime)
  } else {
    vol.utimesSync(dst, atime, mtime)
  }
}

const toUnix = (p: string): string => p.replace(/\\/g, "/")

// memfs resolves relative paths against `process.cwd()`, which would land
// the in-memory tree under the OS working directory. Force a leading `/`
// so a bare relative path (e.g. `mountAt: "app"`) is treated as absolute
// inside the isolated Volume. Paths that are already absolute — either
// POSIX (`/foo`) or Windows with a drive letter (`C:/foo`) — are kept as-is
// because the extra `/` would corrupt the drive-letter form on Windows
// (`path.resolve("/C:/foo")` becomes `E:\C:\foo`).
const toVolumePath = (p: string): string => {
  const normalized = toUnix(p)
  if (normalized.startsWith("/")) return normalized
  if (/^[A-Za-z]:/.test(normalized)) return normalized
  return "/" + normalized
}

const populate = (
  vol: Volume,
  fs: FileSystem.FileSystem,
  src: string,
  dst: string,
): Effect.Effect<void, PlatformError.PlatformError> =>
  Effect.gen(function* () {
    // Detect symlinks first: readLink only succeeds on actual links,
    // so we use that as the discriminator instead of stat (which follows).
    const linkOpt = yield* Effect.option(fs.readLink(src))
    if (Option.isSome(linkOpt)) {
      yield* fromSync(() => vol.symlinkSync(linkOpt.value, dst), "symlink", dst)
      // Apply the link's own metadata via l* variants so we never follow.
      const stat = yield* Effect.option(fs.stat(src))
      if (Option.isSome(stat)) {
        copyMode(vol, dst, stat.value, true)
        copyOwner(vol, dst, stat.value, true)
        copyTimestamps(vol, dst, stat.value, true)
      }
      return
    }

    const stat = yield* fs.stat(src)

    if (stat.type === "Directory") {
      // Always grant the user write+execute bits so the recursive mkdir
      // chain stays traversable AND children can be written. Some
      // platforms (notably Windows) report `0o444`/`0o666` for read-only
      // directories (e.g. `.git/objects/...`), which makes memfs reject
      // child writes with EACCES without this.
      const dirMode = (stat.mode & 0o777) | 0o300
      yield* fromSync(() => vol.mkdirSync(dst, { mode: dirMode, recursive: true }), "mkdir", dst)
      copyOwner(vol, dst, stat, false)
      copyTimestamps(vol, dst, stat, false)
      const children = yield* fs.readDirectory(src)
      for (const child of children) {
        const childSrc = src.endsWith("/") ? src + child : src + "/" + child
        const childDst = dst.endsWith("/") ? dst + child : dst + "/" + child
        yield* populate(vol, fs, childSrc, childDst)
      }
      return
    }

    if (stat.type === "File") {
      const content = yield* fs.readFile(src)
      // memfs rejects the post-create `open` for write on a file that was
      // just created with a read-only mode (e.g. `0o444` for git objects).
      // Write with a writable mode first, then restore the source mode.
      yield* fromSync(() => vol.writeFileSync(dst, content, { mode: 0o666 }), "writeFile", dst)
      yield* fromSync(() => vol.chmodSync(dst, stat.mode & 0o777), "chmod", dst)
      copyOwner(vol, dst, stat, false)
      copyTimestamps(vol, dst, stat, false)
      return
    }

    // BlockDevice, FIFO, Socket, etc. — memfs can represent them but
    // replicating their content/behavior is rarely useful in tests.
    // Silently skip rather than fail loudly; the user can layer in
    // custom handling later if needed.
  })

/**
 * Build a `Volume` that exactly mirrors a path in another `FileSystem`.
 *
 * Walks the source recursively and reproduces every entry — files, empty directories, and symlinks
 * — into the returned `Volume`. File mode, owner, and access/modification times are copied for
 * every entry; symlinks are preserved (not followed) and their own metadata is set via the `l*`
 * variants of the `Volume` API.
 *
 * The source path is mounted at the same path inside the Volume, so a source at `/data/fixtures`
 * lands at `/data/fixtures` in the resulting in-memory filesystem. To remap, use the `mountAt`
 * option.
 *
 * The `FileSystem` service is supplied by the caller, so this works with Node's filesystem, Bun's,
 * an in-memory mock, or any other Effect-TS `FileSystem` implementation.
 */
export const makeVolFromFileSystem = (
  fs: FileSystem.FileSystem,
  path: string,
  options?: { readonly mountAt?: string },
): Effect.Effect<Volume, PlatformError.PlatformError> =>
  Effect.gen(function* () {
    const vol = new Volume()
    // Normalize to forward slashes so the source path (which may use
    // OS-native separators, e.g. backslashes on Windows) lands at the
    // same place inside the memfs Volume, which only speaks POSIX.
    const src = toUnix(path)
    const dst = toVolumePath(options?.mountAt ?? path)
    yield* populate(vol, fs, src, dst)
    return vol
  })
