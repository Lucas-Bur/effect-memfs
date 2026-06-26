import { PlatformError } from "effect"

const systemError = (
  _tag: PlatformError.SystemErrorTag,
  method: string,
  msg: string,
  path: string,
) =>
  PlatformError.systemError({
    module: "FileSystem",
    method,
    _tag,
    description: msg,
    pathOrDescriptor: path,
  })

export const toPlatformError = (
  method: string,
  err: unknown,
  path?: string,
): PlatformError.PlatformError => {
  const e = err as { code?: string; message?: string; path?: string }
  const code = e.code ?? ""
  const msg = e.message ?? String(err)
  const descPath = path ?? e.path ?? ""

  switch (code) {
    case "ENOENT":
    case "ENOTFOUND":
      return systemError("NotFound", method, msg, descPath)
    case "EEXIST":
      return systemError("AlreadyExists", method, msg, descPath)
    case "EISDIR":
    case "ERR_FS_EISDIR":
    case "ENOTDIR":
    case "ENOTEMPTY":
    case "EBADF":
    case "ERR_DIR_CLOSED":
    case "ERR_DIR_CONCURRENT_OPERATION":
      return systemError("BadResource", method, msg, descPath)
    case "EPERM":
    case "EACCES":
      return systemError("PermissionDenied", method, msg, descPath)
    case "EMFILE":
    case "EBUSY":
      return systemError("Busy", method, msg, descPath)
    case "EINVAL":
    case "ENOSYS":
    case "EPROTO":
    case "ERR_OUT_OF_RANGE":
      return systemError("InvalidData", method, msg, descPath)
    case "ETIMEDOUT":
      return systemError("TimedOut", method, msg, descPath)
    case "EAGAIN":
    case "EWOULDBLOCK":
      return systemError("WouldBlock", method, msg, descPath)
    case "ERR_INVALID_ARG_VALUE":
    case "ERR_INVALID_FILE_URL_HOST":
    case "ERR_INVALID_FILE_URL_PATH":
    case "ERR_INVALID_OPT_VALUE":
    case "ERR_INVALID_OPT_VALUE_ENCODING":
      return PlatformError.badArgument({
        module: "FileSystem",
        method,
        description: msg,
      })
    default:
      break
  }

  if (code) {
    return systemError("Unknown", method, msg, descPath)
  }

  return PlatformError.badArgument({
    module: "FileSystem",
    method,
    description: msg,
  })
}
