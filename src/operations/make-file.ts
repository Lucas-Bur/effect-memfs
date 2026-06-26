import { Effect, FileSystem, Option, PlatformError } from "effect"
import type { Volume } from "memfs"

import { fromSync } from "../helpers/promise.js"
import { makeInfo } from "./stat.js"

export const makeFile = (vol: Volume) => {
  class FileImpl implements FileSystem.File {
    readonly [FileSystem.FileTypeId]: typeof FileSystem.FileTypeId = FileSystem.FileTypeId
    readonly fd: FileSystem.File.Descriptor
    private readonly append: boolean
    private readonly path: string
    private position: bigint = 0n

    constructor(fd: FileSystem.File.Descriptor, append: boolean, path: string) {
      this[FileSystem.FileTypeId] = FileSystem.FileTypeId
      this.fd = fd
      this.append = append
      this.path = path
    }

    get stat() {
      return Effect.map(
        fromSync(() => vol.fstatSync(Number(this.fd)), "fstat", this.path),
        makeInfo,
      )
    }

    get sync() {
      return fromSync(() => vol.fsyncSync(Number(this.fd)), "fsync", this.path)
    }

    seek(offset: FileSystem.SizeInput, from: FileSystem.SeekMode) {
      const offsetSize = FileSystem.Size(offset)
      return Effect.sync(() => {
        if (from === "start") {
          this.position = offsetSize
        } else if (from === "current") {
          this.position = this.position + offsetSize
        }
        return this.position
      })
    }

    read(buffer: Uint8Array) {
      return Effect.suspend(() => {
        const position = this.position
        return Effect.map(
          fromSync(
            () => {
              const bytesRead = vol.readSync(
                Number(this.fd),
                buffer,
                0,
                buffer.length,
                Number(position),
              )
              return FileSystem.Size(bytesRead)
            },
            "read",
            this.path,
          ),
          (bytesRead) => {
            const sizeRead = FileSystem.Size(bytesRead)
            this.position = position + sizeRead
            return sizeRead
          },
        )
      })
    }

    readAlloc(size: FileSystem.SizeInput) {
      const sizeNumber = Number(size)
      return Effect.suspend(() => {
        const buffer = new Uint8Array(sizeNumber)
        const position = this.position
        return Effect.map(
          fromSync(
            () => {
              const bytesRead = vol.readSync(
                Number(this.fd),
                buffer,
                0,
                sizeNumber,
                Number(position),
              )
              this.position = position + BigInt(bytesRead)
              return bytesRead
            },
            "readAlloc",
            this.path,
          ),
          (bytesRead): Option.Option<Uint8Array> => {
            if (bytesRead === 0) {
              return Option.none()
            }
            if (bytesRead === sizeNumber) {
              return Option.some(buffer)
            }
            const dst = new Uint8Array(bytesRead)
            dst.set(buffer.subarray(0, bytesRead))
            return Option.some(dst)
          },
        )
      })
    }

    truncate(length?: FileSystem.SizeInput) {
      return Effect.map(
        fromSync(
          () => vol.ftruncateSync(Number(this.fd), length ? Number(length) : undefined),
          "ftruncate",
          this.path,
        ),
        () => {
          if (!this.append) {
            const len = BigInt(length ?? 0)
            if (this.position > len) {
              this.position = len
            }
          }
        },
      )
    }

    write(buffer: Uint8Array) {
      return Effect.suspend(() => {
        const position = this.position
        return Effect.map(
          fromSync(
            () => {
              const writePos = this.append
                ? Number(vol.fstatSync(Number(this.fd)).size)
                : Number(position)
              const bytesWritten = vol.writeSync(
                Number(this.fd),
                buffer,
                0,
                buffer.length,
                writePos,
              )
              return FileSystem.Size(bytesWritten)
            },
            "write",
            this.path,
          ),
          (bytesWritten) => {
            const sizeWritten = FileSystem.Size(bytesWritten)
            if (!this.append) {
              this.position = position + sizeWritten
            }
            return sizeWritten
          },
        )
      })
    }

    writeAll(buffer: Uint8Array) {
      return this.writeAllChunk(buffer)
    }

    private writeAllChunk(buffer: Uint8Array): Effect.Effect<void, PlatformError.PlatformError> {
      return Effect.suspend(() => {
        const position = this.position
        return Effect.flatMap(
          fromSync(
            () => {
              const writePos = this.append
                ? Number(vol.fstatSync(Number(this.fd)).size)
                : Number(position)
              const bytesWritten = vol.writeSync(
                Number(this.fd),
                buffer,
                0,
                buffer.length,
                writePos,
              )
              return FileSystem.Size(bytesWritten)
            },
            "writeAll",
            this.path,
          ),
          (bytesWritten) => {
            const n = Number(bytesWritten)
            if (n === 0) {
              return Effect.fail(
                PlatformError.systemError({
                  module: "FileSystem",
                  method: "writeAll",
                  _tag: "WriteZero",
                  pathOrDescriptor: this.path,
                  description: "write returned 0 bytes written",
                }),
              )
            }
            if (!this.append) {
              this.position = position + bytesWritten
            }
            return n < buffer.length ? this.writeAllChunk(buffer.subarray(n)) : Effect.void
          },
        )
      })
    }
  }

  return (fd: FileSystem.File.Descriptor, append: boolean, path: string): FileSystem.File =>
    new FileImpl(fd, append, path)
}
