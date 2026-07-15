import { describe, expect, it } from "@effect/vitest"

import { makeVol } from "../src/helpers/volume.js"

describe("makeVol", () => {
  it("creates an empty volume by default", () => {
    const vol = makeVol()
    expect(vol.readdirSync("/")).toStrictEqual([])
  })

  it("populates flat paths", () => {
    const vol = makeVol({
      "/a.txt": "A",
      "/b.txt": "B",
      "/sub/c.txt": "C",
    })
    expect(vol.readFileSync("/a.txt", "utf8")).toBe("A")
    expect(vol.readFileSync("/b.txt", "utf8")).toBe("B")
    expect(vol.readFileSync("/sub/c.txt", "utf8")).toBe("C")
  })

  it("creates empty directories from null", () => {
    const vol = makeVol({
      "/pkg": null,
    })
    const stat = vol.statSync("/pkg")
    expect(stat.isDirectory()).toBe(true)
    expect(vol.readdirSync("/pkg")).toStrictEqual([])
  })

  it("creates empty files from empty string", () => {
    const vol = makeVol({
      "/empty.txt": "",
    })
    const stat = vol.statSync("/empty.txt")
    expect(stat.isFile()).toBe(true)
    expect(vol.readFileSync("/empty.txt", "utf8")).toBe("")
  })

  it("populates nested JSON", () => {
    const vol = makeVol({
      app: {
        "index.js": "1",
        src: {
          "main.ts": "2",
          util: {
            "log.ts": "3",
          },
        },
      },
    })
    expect(vol.readFileSync("/app/index.js", "utf8")).toBe("1")
    expect(vol.readFileSync("/app/src/main.ts", "utf8")).toBe("2")
    expect(vol.readFileSync("/app/src/util/log.ts", "utf8")).toBe("3")
  })

  it("handles nested empty directories", () => {
    const vol = makeVol({
      project: {
        dist: null,
        src: {
          "index.ts": "export {}",
        },
      },
    })
    expect(vol.statSync("/project/dist").isDirectory()).toBe(true)
    expect(vol.readdirSync("/project/dist")).toStrictEqual([])
    expect(vol.readFileSync("/project/src/index.ts", "utf8")).toBe("export {}")
  })

  it("handles mixed flat and nested entries", () => {
    const vol = makeVol({
      "/root-file.txt": "top-level",
      nested: {
        "inner.txt": "inside",
      },
      "/another-root": null,
    })
    expect(vol.readFileSync("/root-file.txt", "utf8")).toBe("top-level")
    expect(vol.readFileSync("/nested/inner.txt", "utf8")).toBe("inside")
    expect(vol.statSync("/another-root").isDirectory()).toBe(true)
  })

  it("handles deeply nested structure", () => {
    const vol = makeVol({
      a: {
        b: {
          c: {
            d: {
              "e.txt": "deep",
            },
          },
        },
      },
    })
    expect(vol.readFileSync("/a/b/c/d/e.txt", "utf8")).toBe("deep")
  })

  it("handles multiple roots via path-like keys", () => {
    const vol = makeVol({
      "/foo": {
        "bar.txt": "bar",
      },
      "/baz": {
        "qux.txt": "qux",
      },
    })
    expect(vol.readFileSync("/foo/bar.txt", "utf8")).toBe("bar")
    expect(vol.readFileSync("/baz/qux.txt", "utf8")).toBe("qux")
  })
})
