import { expect } from "@effect/vitest"
import { Cause, Effect, Exit, Option, type PlatformError } from "effect"

export const expectError = <A, R = never>(
  effect: Effect.Effect<A, PlatformError.PlatformError, R>,
  expectedTag: string,
): Effect.Effect<void, never, R> =>
  Effect.gen(function* () {
    const exit = yield* Effect.exit(effect)
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      const err = Cause.findErrorOption(exit.cause)
      if (Option.isSome(err)) {
        expect(err.value._tag).toBe("PlatformError")
        expect(err.value.reason._tag).toBe(expectedTag)
      }
    }
  })
