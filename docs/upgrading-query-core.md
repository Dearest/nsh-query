# Upgrading query-core

nsh-query runs `@tanstack/query-core` (and the two persistence packages) unmodified, copied into `vendor/` by `scripts/sync-vendor.mjs`. An upgrade changes `vendor/` and, when upstream changed something the adapter depends on, `src/` and the tests.

## Trying a version locally

Any version works, a beta or the next major included:

```sh
node scripts/sync-vendor.mjs 5.110.0
scripts/check.sh
```

To get the same report and pull request body the automation writes:

```sh
scripts/upstream-update.sh 5.110.0 /tmp/upstream   # syncs vendor/, writes report.md, check.log, body.md, status
```

`node scripts/upstream-report.mjs <old> <new>` prints the report alone. Go back with `node scripts/sync-vendor.mjs <old>` or `git checkout vendor`.

## The weekly pull request

`.github/workflows/upstream.yml` runs every Monday (and by hand, from the Actions tab, with a version). When npm has a newer query-core than `vendor/VERSIONS.json`, it runs `scripts/upstream-update.sh` and opens a pull request `fix(core): update query-core to X` (a patch release) or `feat(core): ...` (a minor or major one) on the branch `upstream/query-core-X`. The body has the result of `scripts/check.sh` and the report:

1. **query-core exports** added and removed, values and types.
2. **The official adapters' `src/` diff**, `@tanstack/react-query` and `@tanstack/solid-query` between the two versions: what they had to change is the best hint of what this adapter has to change.
3. **The releases** in between, with links to their notes.

A pull request opened with the workflow's own token does not start other workflows: close and reopen it (or push a commit to it) to run CI on it.

## Reviewing it

- **All green, patch release**: merge it.
- **Red, or a minor or major release**: work on the branch.
  1. Read section 2 of the report. A change in react-query's `useBaseQuery.ts`, `useQueries.ts` or `useMutation.ts` usually has a counterpart in `src/useBaseQuery.ts`, `src/useQueries.ts` or `src/useMutation.ts`; a new option or hook in solid-query is a candidate for the API (see `CONTRIBUTING.md`, scope rule 1).
  2. `tests/core-contract.test.tsx` failing names the query-core internal that changed (`getOptimisticResult`, `trackProp`, `setBatchNotifyFunction`, ...). Adapt the adapter to it, then the contract check.
  3. `tests/api-surface.test.tsx` failing prints the new export list: if the change is expected, paste it into `tests/api-surface.json`. The diff of that file is what users see change; note it in the pull request.
  4. New upstream test cases in the adapters' `__tests__`: add them to `tests/PARITY.md` and port the applicable ones (`tests/<topic>.parity*.test.tsx`).
  5. `scripts/check.sh` green, then merge with a Conventional Commit title (`fix(core):` / `feat(core):`), so that release-please puts the upgrade in the changelog.

Never edit `vendor/` by hand: `scripts/check.sh` compares it with a fresh sync and fails on any difference. A query-core bug is fixed upstream, in TanStack/query.
