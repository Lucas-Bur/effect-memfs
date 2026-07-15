import { describe, expect, it } from "@effect/vitest"
import type { PlatformError } from "effect"

import { toPlatformError } from "../src/helpers/error.js"

describe("toPlatformError", () => {
  const method = "test"
  const msg = "something went wrong"
  const path = "/foo"

  const reason = (err: PlatformError.PlatformError) => err.reason
  const sysReason = (err: PlatformError.PlatformError) => reason(err) as PlatformError.SystemError

  const mkErr = (code: string) => ({ code, message: msg, path })

  // NotFound
  it("ENOENT → NotFound", () =>
    expect(reason(toPlatformError(method, mkErr("ENOENT")))._tag).toBe("NotFound"))
  it("ENOTFOUND → NotFound", () =>
    expect(reason(toPlatformError(method, mkErr("ENOTFOUND")))._tag).toBe("NotFound"))

  // AlreadyExists
  it("EEXIST → AlreadyExists", () =>
    expect(reason(toPlatformError(method, mkErr("EEXIST")))._tag).toBe("AlreadyExists"))

  // BadResource
  it("EISDIR → BadResource", () =>
    expect(reason(toPlatformError(method, mkErr("EISDIR")))._tag).toBe("BadResource"))
  it("ERR_FS_EISDIR → BadResource", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_FS_EISDIR")))._tag).toBe("BadResource"))
  it("ENOTDIR → BadResource", () =>
    expect(reason(toPlatformError(method, mkErr("ENOTDIR")))._tag).toBe("BadResource"))
  it("ENOTEMPTY → BadResource", () =>
    expect(reason(toPlatformError(method, mkErr("ENOTEMPTY")))._tag).toBe("BadResource"))
  it("EBADF → BadResource", () =>
    expect(reason(toPlatformError(method, mkErr("EBADF")))._tag).toBe("BadResource"))
  it("ERR_DIR_CLOSED → BadResource", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_DIR_CLOSED")))._tag).toBe("BadResource"))
  it("ERR_DIR_CONCURRENT_OPERATION → BadResource", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_DIR_CONCURRENT_OPERATION")))._tag).toBe(
      "BadResource",
    ))

  // PermissionDenied
  it("EPERM → PermissionDenied", () =>
    expect(reason(toPlatformError(method, mkErr("EPERM")))._tag).toBe("PermissionDenied"))
  it("EACCES → PermissionDenied", () =>
    expect(reason(toPlatformError(method, mkErr("EACCES")))._tag).toBe("PermissionDenied"))

  // Busy
  it("EMFILE → Busy", () =>
    expect(reason(toPlatformError(method, mkErr("EMFILE")))._tag).toBe("Busy"))
  it("EBUSY → Busy", () =>
    expect(reason(toPlatformError(method, mkErr("EBUSY")))._tag).toBe("Busy"))

  // InvalidData
  it("EINVAL → InvalidData", () =>
    expect(reason(toPlatformError(method, mkErr("EINVAL")))._tag).toBe("InvalidData"))
  it("ENOSYS → InvalidData", () =>
    expect(reason(toPlatformError(method, mkErr("ENOSYS")))._tag).toBe("InvalidData"))
  it("EPROTO → InvalidData", () =>
    expect(reason(toPlatformError(method, mkErr("EPROTO")))._tag).toBe("InvalidData"))
  it("ERR_OUT_OF_RANGE → InvalidData", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_OUT_OF_RANGE")))._tag).toBe("InvalidData"))

  // TimedOut
  it("ETIMEDOUT → TimedOut", () =>
    expect(reason(toPlatformError(method, mkErr("ETIMEDOUT")))._tag).toBe("TimedOut"))

  // WouldBlock
  it("EAGAIN → WouldBlock", () =>
    expect(reason(toPlatformError(method, mkErr("EAGAIN")))._tag).toBe("WouldBlock"))
  it("EWOULDBLOCK → WouldBlock", () =>
    expect(reason(toPlatformError(method, mkErr("EWOULDBLOCK")))._tag).toBe("WouldBlock"))

  // badArgument (ERR_INVALID_*)
  it("ERR_INVALID_ARG_VALUE → BadArgument", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_INVALID_ARG_VALUE")))._tag).toBe(
      "BadArgument",
    ))
  it("ERR_INVALID_FILE_URL_HOST → BadArgument", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_INVALID_FILE_URL_HOST")))._tag).toBe(
      "BadArgument",
    ))
  it("ERR_INVALID_FILE_URL_PATH → BadArgument", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_INVALID_FILE_URL_PATH")))._tag).toBe(
      "BadArgument",
    ))
  it("ERR_INVALID_OPT_VALUE → BadArgument", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_INVALID_OPT_VALUE")))._tag).toBe(
      "BadArgument",
    ))
  it("ERR_INVALID_OPT_VALUE_ENCODING → BadArgument", () =>
    expect(reason(toPlatformError(method, mkErr("ERR_INVALID_OPT_VALUE_ENCODING")))._tag).toBe(
      "BadArgument",
    ))

  // Unknown (any other code with code present)
  it("unknown code → Unknown", () =>
    expect(reason(toPlatformError(method, mkErr("ESOMETHING")))._tag).toBe("Unknown"))

  // No code → BadArgument
  it("no code (plain Error) → BadArgument", () =>
    expect(reason(toPlatformError(method, new Error(msg)))._tag).toBe("BadArgument"))
  it("no code (object without code) → BadArgument", () =>
    expect(reason(toPlatformError(method, { message: msg }))._tag).toBe("BadArgument"))
  it("no code (primitive) → BadArgument", () =>
    expect(reason(toPlatformError(method, 42))._tag).toBe("BadArgument"))

  // Path precedence
  it("explicit path overrides err.path", () => {
    const err = toPlatformError(
      method,
      { code: "ENOENT", message: msg, path: "/errpath" },
      "/explicit",
    )
    expect(sysReason(err).pathOrDescriptor).toBe("/explicit")
  })
  it("fallback to err.path when no explicit path", () => {
    const err = toPlatformError(method, { code: "ENOENT", message: msg, path: "/errpath" })
    expect(sysReason(err).pathOrDescriptor).toBe("/errpath")
  })
  it("empty path when neither provided", () => {
    const err = toPlatformError(method, { code: "ENOENT", message: msg })
    expect(sysReason(err).pathOrDescriptor).toBe("")
  })
})
