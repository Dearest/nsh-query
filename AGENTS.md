# Working in nsh-query

nsh-query is the TanStack Query adapter for NSH (https://nsh.dev, TSX). The cache engine is `@tanstack/query-core`, vendored unmodified; this repository holds the adapter, the platform wiring and the persistence preset.

## Environment

- NSH 0.6 nightly or newer. `nsh --version` should print `nsh 0.6.0 (...)` or later. Install with `curl -fsSL https://nsh.dev/install.sh | sh -s -- --nightly`.
- Node 20+ (only for `scripts/*.mjs`; the library itself never runs on Node).
- NSH's real API signatures are the generated `tests/.nsh/types/nsh/*.d.ts` (`index.d.ts`: reactive primitives and platform signals; `test.d.ts`: the test API). Run `nsh check` in `tests/` once to generate them. Prefer them over memory or older docs.

## The one command

```sh
scripts/check.sh
```

It checks that `vendor/` is exactly what the sync script produces, then runs `nsh check` and `nsh test` in `tests/` (and in `example/` once it exists). Green locally means green in CI.

## Map

```text
src/            the library (one export per file; src/index.ts re-exports)
src/core.ts     the only file that imports vendor/query-core
vendor/         @tanstack packages, written by scripts/sync-vendor.mjs, never edited by hand
scripts/        sync-vendor.mjs, check.sh
tests/          an NSH app that depends on the library by path ({ "path": ".." })
  fixtures/<topic>/*.tsx   one entry per scenario, each calls mount()
  <topic>.test.tsx         tests for src/<topic>.ts, opening fixtures/<topic>/*
docs/adr/       design decisions, one page each
```

## Invariants

1. query-core enters only through `src/core.ts`. Everything else imports from `./core`. A second copy of query-core breaks `focusManager`, `onlineManager` and `notifyManager`, which are module singletons.
2. Never edit `vendor/` by hand. To change it, run `node scripts/sync-vendor.mjs <version>`.
3. The library source has no JSX and uses only erasable TypeScript (no `enum`, no parameter properties, no `namespace`). NSH strips types and does not transform.
4. Tests always use a manual clock and stubbed network: `open(entry, { clock: {}, network: { ... } })`, and move time with `app.clock.runFor(ms)`.

## Tests

- A test file cannot reach into the app it opens; they run on different engines. Render the state you want to assert as `<Text testID="...">` in the fixture and read it with `app.texts()`, `app.shows()`, `app.waitFor()`, or check `app.requests()` and `app.storage()`.
- Fixtures import from `"nsh-query"` exactly as an application does.
- `tests/tsconfig.json` turns on `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride` and `verbatimModuleSyntax`; the library must type check under them, because applications check our source with their own settings.
- Do not use `test.skip` or loosen assertions to make a check pass.
