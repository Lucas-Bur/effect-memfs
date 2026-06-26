import { Effect, FileSystem, Option } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

type MemfsStats = Awaited<ReturnType<Volume["promises"]["stat"]>>

const makeInfo = (stat: MemfsStats): FileSystem.File.Info => ({
  type: stat.isFile()
    ? "File"
    : stat.isDirectory()
      ? "Directory"
      : stat.isSymbolicLink()
        ? "SymbolicLink"
        : stat.isBlockDevice()
          ? "BlockDevice"
          : stat.isCharacterDevice()
            ? "CharacterDevice"
            : stat.isFIFO()
              ? "FIFO"
              : stat.isSocket()
                ? "Socket"
                : "Unknown",
  mtime: Option.fromNullishOr(stat.mtime),
  atime: Option.fromNullishOr(stat.atime),
  birthtime: Option.fromNullishOr(stat.birthtime),
  dev: Number(stat.dev),
  rdev: Option.fromNullishOr(Number(stat.rdev)),
  ino: Option.fromNullishOr(Number(stat.ino)),
  mode: Number(stat.mode),
  nlink: Option.fromNullishOr(Number(stat.nlink)),
  uid: Option.fromNullishOr(Number(stat.uid)),
  gid: Option.fromNullishOr(Number(stat.gid)),
  size: FileSystem.Size(stat.size),
  blksize: Option.fromNullishOr(FileSystem.Size(stat.blksize)),
  blocks: Option.fromNullishOr(Number(stat.blocks)),
})

export { makeInfo }

export const stat =
  (vol: Volume): FileSystem.FileSystem["stat"] =>
  (path) =>
    fromPromise(() => vol.promises.stat(path), "stat", path).pipe(Effect.map((s) => makeInfo(s)))
