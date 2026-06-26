# Workflow: Implementing each function in src/

## 1. Analyze signatures

- **Effect FileSystem**: `node_modules/effect/dist/FileSystem.d.ts` — the function signature in `FileSystem.FileSystem`
- **memfs Promises**: `FsPromisesApi` in `@jsonjoy.com/fs-node/lib/types/FsPromisesApi.d.ts`
- **memfs Options Interfaces**: `@jsonjoy.com/fs-node-utils/lib/types/options.d.ts`

For each function:

1. Note Effect signature (params, return type, options interface)
2. Note memfs signature (same steps)
3. Map options fields 1:1

## 2. Check reference

- `https://github.com/Effect-TS/effect-smol/blob/main/packages/platform-node-shared/src/NodeFileSystem.ts`
- Find the same function there, understand the mapping
- Don't blindly copy — note differences to memfs
- Try to copy the defauls set by this implementation, e.g. when there is: `options?.overwrite ?? false,` we should also set the default accordingly

## 3. Define options mapping

Map each Effect option field to memfs options. Rules:

- **`??`** for defaults (only when `undefined`)
- **`===`** for explicit boolean checks
- Use memfs constants instead of magic numbers (`constants.R_OK` instead of `4`)
- List all memfs options fields exhaustively (don't miss any)

| Effect Option                  | memfs Option                   | Mapping                        |
| ------------------------------ | ------------------------------ | ------------------------------ |
| `overwrite?: boolean`          | `force: boolean`               | `options?.overwrite ?? true`   |
| `overwrite?: boolean`          | `errorOnExist: boolean`        | `options?.overwrite === false` |
| `preserveTimestamps?: boolean` | `preserveTimestamps?: boolean` | `options?.preserveTimestamps`  |

## 4. Test-first (TDD)

- Read existing tests, identify wrong assumptions
- Write one test per behavior (red)
- Orient on effect-smol tests: `https://github.com/Effect-TS/effect-smol/blob/main/packages/platform-node-shared/test/NodeFileSystem.test.ts`
- Test design:
  - Default behavior (no options)
  - With options (true/false)
  - Error cases
- Test integration, not memfs itself
- Also test negative space and assert that errors work
- **Integration: test derived/default methods** — Effect's `FileSystem.make()` provides
  default implementations for `exists`, `readFileString`, `stream`, etc. that delegate
  to the core function under test (e.g. `exists` → `access`). Include integration tests
  in the same test file to verify this delegation works end-to-end. Mark them with
  `[integration via {function}]` in the test name and reference the source location
  (e.g. `FileSystem.ts:770`).

## 5. Implement

- Only the mapping in `src/{function}.ts`
- No additional logic (stat/rm/if-else outside the option mapping)
- Use `fromPromise` from `./volume.js`

## 6. Validate

- `npx vitest run test/{function}.test.ts`
- All tests green
- `npx tsc --noEmit -p tsconfig.json` — no TypeScript errors
