# Working in nsh-query

nsh-query is the TanStack Query adapter for NSH (https://nsh.dev, TSX). The cache engine is `@tanstack/query-core`, vendored unmodified; this repository holds the adapter (`src/`), the platform wiring and the persistence preset. Read `CONTRIBUTING.md` for the scope rules; this page is the working manual.

## Environment

- NSH 0.6 nightly: `curl -fsSL https://nsh.dev/install.sh | sh -s -- --nightly`, then put `~/.nsh/bin` first on `PATH`. `nsh --version` prints `nsh 0.6.0 (...)`.
- Node 20 or newer, only for `scripts/*.mjs` (the library never runs on Node). No `npm install` anywhere.
- Network access to registry.npmjs.org: `scripts/check.sh` re-downloads the vendored packages to compare them.
- NSH's real API is the generated `tests/.nsh/types/nsh/*.d.ts`: `index.d.ts` (signals, effects, components, `lifecycle`, `network`, `Storage`), `globals.d.ts` (`If`, `Each`), `test.d.ts` (`open`, `App`, `expect`). They appear after the first `nsh check` in `tests/`. Trust them over memory and older docs.

## The one command

```sh
scripts/check.sh
```

In order: `vendor/` equals a fresh `scripts/sync-vendor.mjs` of the recorded version; every export of the library's own is used in a test (`scripts/check-exports.mjs`); every test named in `tests/PARITY.md` exists (`scripts/check-parity.mjs`); then `nsh check` and `nsh test` in `tests/` and in `example/`. It stops at the first failure. CI runs the same script.

While working, run one file: `cd tests && nsh test useQuery.test.tsx`, or some tests: `nsh test --filter "field tracking"` (`nsh test` takes one path). `nsh check` in `tests/` type checks the library with the strictest settings apps may use.

## Map

```text
src/                   the library; src/index.ts is the entry "nsh-query"
  core.ts              the only file that imports vendor/query-core
  index.ts             environment fixes at import time, then the exports
  QueryClient.ts  QueryClientProvider.ts  connect.ts  isRestoring.ts
  useBaseQuery.ts      the adapter behind useQuery and useInfiniteQuery
  useQuery.ts  useInfiniteQuery.ts  useQueries.ts  useMutation.ts
  useIsFetching.ts  useIsMutating.ts  useMutationState.ts
  queryOptions.ts  infiniteQueryOptions.ts  mutationOptions.ts  types.ts
  readonlyView.ts      the reactive read-only object every hook returns
  persist/index.ts     the entry "nsh-query/persist"
vendor/                TanStack's published build, written by scripts/sync-vendor.mjs only
scripts/               check.sh, sync-vendor.mjs, upstream-report.mjs, upstream-update.sh, check-*.mjs
tests/                 an NSH app depending on the library by path ({ "path": ".." })
  App.tsx              a placeholder entry: nsh check and nsh test need one
  fixtures/<topic>/*.tsx   one entry per scenario (each calls mount)
  <topic>.test.tsx     cases for src/<topic>.ts, opening fixtures/<topic>/*
  <topic>.parity*.test.tsx + fixtures/<topic>/parity*.tsx   ports of upstream tests (PARITY.md)
  support/             components and helpers shared by fixtures; parity.tsx / parityTest.ts is the parity harness
  types/*.ts           type-level cases: checked by nsh check, never run
  api-surface.json     the runtime exports of each entry
  core-contract.test.tsx   the query-core internals the adapter relies on
  PARITY.md            every upstream hook test and what became of it
example/               a demo app with its own tests (an NSH app, { "path": ".." })
docs/                  api.md, differences.md, upgrading-query-core.md, adr/
skills/nsh-query/      the skill for agents writing apps with nsh-query: SKILL.md (every task) + references/ (one page per task)
```

A test's topic is the `src/` file it covers: a change to `src/useMutation.ts` gets cases in `tests/useMutation.test.tsx` with fixtures in `tests/fixtures/useMutation/`.

## Invariants

1. **query-core enters only through `src/core.ts`.** Everything imports from `./core`. `focusManager`, `onlineManager` and `notifyManager` are module singletons: a second copy breaks the platform wiring.
2. **Never edit `vendor/` by hand.** Change it with `node scripts/sync-vendor.mjs <version>`; `scripts/check.sh` fails on any other difference.
3. **No JSX in `src/`, only erasable TypeScript** (no `enum`, no parameter properties, no `namespace`): NSH strips types and does not transform. Render components by calling them: `Ctx.Provider({ value, get children() { return props.children; } })`.
4. **Tests use a manual clock and stubbed network**: `open(entry, { clock: {}, network: { "<url>": { body } } })`, time moved with `await app.clock!.runFor(ms)`. Never the real network or real waiting.

## Adding a feature

1. `src/<name>.ts` with one public export, TSDoc with an example; export it from `src/index.ts` (persistence: `src/persist/index.ts`). A new export always gets a file of its own, even when it builds on an existing one.
2. A fixture `tests/fixtures/<name>/<scenario>.tsx` and cases in `tests/<name>.test.tsx`. A small export built on an existing one may add its cases to that export's test file and fixtures instead.
3. Add the export to the import and the `values` list in `tests/types/public-api.ts`. If it has public types of its own, add type cases in `tests/types/<name>.ts` (`// @ts-expect-error` above misuse).
4. Add the export's name to its entry's array in `tests/api-surface.json`, in alphabetical order. `cd tests && nsh test api-surface.test.tsx` passes once the file matches the runtime exports.
5. A section in `docs/api.md` (signature, parameters, return, example, differences from TanStack) and a line in the contents list at its top; `docs/differences.md` if the behavior differs from TanStack's documentation.
6. If it uses a query-core member that is not documented API, add a check to `tests/fixtures/core-contract/contract.tsx` and its name to `tests/core-contract.test.tsx`.
7. `scripts/check.sh` passes.

## Writing tests

- The test and the app run on different engines. The test sees only the screen (`app.texts()`, `app.shows("text:...")`, `app.count(...)`), `app.requests()` and `app.storage()`. Render what you assert: `<Text>{\`status: ${todo.status}\`}</Text>`, then `expect(app.texts()).toContain("status: success")`.
- Fixtures import from `"nsh-query"`, as an app does. Shared pieces go in `tests/support/` (not entries). `tests/support/Button.tsx` is a pressable label: `await app.press("Refetch")`.
- A step (`press`, `runFor`, `setLifecycle`, ...) resolves once the app is quiet, notifications included: assert right after it. Network stubs with `delay` answer when the clock passes it.
- Platform events: `app.setLifecycle("background" | "inactive" | "active")`, `app.setNetworkState({ kind: "none" })`, `app.wake()`.
- `app.texts()` only returns what is on screen (390x844 by default): open with a larger `width`/`height` when you render long logs or lists.
- Effects run after the elements of their pass exist, in creation order; a signal write runs its dependants at once unless inside `batch`.
- On the manual clock, a chain of 0 ms timers waiting for `Storage` never settles: use a delay of at least 1 ms in such loops.
- `nsh/test`'s `expect` has no `toStrictEqual`; use `toEqual`/`toMatchObject`.
- Never `test.skip`, never loosen an assertion to make a check pass.

## Porting an upstream test

The parity harness puts many scenarios in one fixture: `runScenarios({ "<upstream test name>": ({ queryClient }) => <JSX/> })` in `tests/fixtures/<topic>/parity*.tsx`, and in the test `openScenario(entry, "<name>")`, `advance(app, ms)`, `logs(app)` (what the scenario passed to `log(...)`). Name the test exactly as upstream, then update its row in `tests/PARITY.md` (`ported`, with `` `file` › title ``).

## Commits

Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `feat(core):` for a query-core upgrade). Do not touch `nsh.json`'s version or `CHANGELOG.md`: release-please owns them. Code, comments and docs in English.
