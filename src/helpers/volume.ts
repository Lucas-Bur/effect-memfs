import { Volume } from "memfs"

export interface FileTree {
  [key: string]: string | null | FileTree
}

export const makeVol = (initialFiles: FileTree = {}): Volume =>
  Volume.fromNestedJSON(initialFiles, "/")
