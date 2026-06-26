import { Cause, Effect, type FileSystem, PlatformError, Queue, Stream } from "effect"
import type { Volume } from "memfs"

import { fromPromise } from "../helpers/promise.js"

// QUIRK (?): memfs fires the watcher callback twice per writeFileSync
// (two "change" events for a single write). This is a bug in the
// underlying @jsonjoy/fs-node Volume or intended behaviour I don't understand;
// our mapping is correct.
// We do not debounce because a real FileSystem may legitimately
// fire multiple events, and swallowing them would mask real behavior.

const watchNode = (vol: Volume) => (path: string) =>
  Stream.callback<FileSystem.WatchEvent, PlatformError.PlatformError>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const watcher = vol.watch(path, { recursive: true }, (event, name) => {
          if (!name) return
          switch (event) {
            case "rename": {
              const fullPath = path === "/" ? "/" + name : path + "/" + name
              Effect.runFork(
                Effect.matchEffect(
                  fromPromise(() => vol.promises.stat(fullPath), "stat", fullPath),
                  {
                    onSuccess: () => Queue.offer(queue, { _tag: "Create", path: name }),
                    onFailure: () => Queue.offer(queue, { _tag: "Remove", path: name }),
                  },
                ),
              )
              return
            }
            case "change": {
              Queue.offerUnsafe(queue, { _tag: "Update", path: name })
              return
            }
          }
        })
        watcher.on("error", (error: unknown) => {
          Queue.failCauseUnsafe(
            queue,
            Cause.fail(
              PlatformError.systemError({
                module: "FileSystem",
                _tag: "Unknown",
                method: "watch",
                pathOrDescriptor: path,
                cause: error,
              }),
            ),
          )
        })
        watcher.on("close", () => {
          Queue.endUnsafe(queue)
        })
        return watcher
      }),
      (watcher) => Effect.sync(() => watcher.close()),
    ),
  )

export const watch =
  (vol: Volume): FileSystem.FileSystem["watch"] =>
  (path) =>
    fromPromise(() => vol.promises.stat(path), "stat", path).pipe(
      Effect.map(() => watchNode(vol)(path)),
      Stream.unwrap,
    )
