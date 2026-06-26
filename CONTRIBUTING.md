# Contributing

## Development workflow

### Branching

Feature branches off `main`, PR back in. Simple GitHub Flow.

```sh
git checkout -b feat/describe-your-change
git push -u origin feat/describe-your-change
# open a PR on GitHub
```

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/). Prefix determines version bump:

| Prefix                                         | Semver                 | Example                          |
| ---------------------------------------------- | ---------------------- | -------------------------------- |
| `feat:`                                        | minor (0.1.0 -> 0.2.0) | `feat: add watch support`        |
| `fix:`                                         | patch (0.1.0 -> 0.1.1) | `fix: handle missing stat field` |
| `feat!:` / `BREAKING CHANGE:`                  | major (0.x.x -> 1.0.0) | `feat!: drop Node 20 support`    |
| `docs:`, `chore:`, `refactor:`, `test:`, `ci:` | no bump                | `docs: update readme`            |

### Quality gates

Run before pushing:

```powershell
pnpm run typecheck
pnpm run lint
pnpm run test:coverage
pnpm run build
```

| Step             | Tool           | Blocks merge |
| ---------------- | -------------- | ------------ |
| Type check       | `tsc --noEmit` | Yes          |
| Lint             | `oxlint`       | Yes          |
| Tests + coverage | `vitest`       | Yes          |
| Build            | `tsdown`       | Yes          |

### Merging

Squash-and-merge single-commit branches, rebase-and-merge multi-commit branches.

## Release process

1. Push/merge commits to `main`
2. [release-please](https://github.com/googleapis/release-please) scans conventional commits
3. If there are unreleased changes, it opens a **release PR** with:
   - Updated `CHANGELOG.md`
   - Bumped version in `package.json`
4. Merge the release PR -> git tag + GitHub Release created
5. Release triggers `publish.yml` -> `pnpm publish`

No manual version bumping. No manual changelog.

## Project structure

```
src/
  helpers/        # Internal utilities (error mapping, effect wrappers, volume)
  operations/     # One file per filesystem operation
  index.ts        # Public API (layer, FileTree)
test/             # Tests mirror the src structure
```
