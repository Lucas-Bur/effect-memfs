import { Effect, type PlatformError } from "effect"

import { toPlatformError } from "./error.js"

export const fromPromise = <A>(
  f: () => Promise<A>,
  method: string,
  path?: string,
): Effect.Effect<A, PlatformError.PlatformError> =>
  Effect.tryPromise({
    try: f,
    catch: (err) => toPlatformError(method, err, path),
  })

export const fromSync = <A>(
  f: () => A,
  method: string,
  path: string,
): Effect.Effect<A, PlatformError.PlatformError> =>
  Effect.try({
    try: f,
    catch: (err) => toPlatformError(method, err, path),
  })
