# 0002. Vendor query-core instead of depending on it from npm

Status: accepted

## Context

nsh-query is a TSX nshm: a Git repository whose `nsh.json` exports TSX entries, installed with `nsh add` and bundled into the app. NSH 0.6 resolves an nshm's imports among its own files, NSH's modules and other nshm. An nshm that imports an npm package (`@tanstack/query-core`) fails at run time with `could not load module '@tanstack/query-core'`, even when the app has the package in its own `node_modules`. query-core is published to npm only.

The adapter also needs exactly one copy of query-core in the app: `focusManager`, `onlineManager` and `notifyManager` are module singletons, and the platform wiring connects to the copy it imports.

## Decision

Copy the published build of `@tanstack/query-core`, `@tanstack/query-persist-client-core` and `@tanstack/query-async-storage-persister` into `vendor/`, unmodified except for the persistence packages' imports of the other two, which point into `vendor/`. `scripts/sync-vendor.mjs <version>` does it, checking each tarball against the registry's sha512 and recording the versions in `vendor/VERSIONS.json`. `scripts/check.sh` fails when `vendor/` differs from a fresh sync. Only `src/core.ts` imports `vendor/query-core`.

Upgrading is `node scripts/sync-vendor.mjs <version>`, and a weekly workflow opens the pull request (`docs/upgrading-query-core.md`).

## Consequences

- Apps install nothing but nsh-query, and get the query-core version it was tested with.
- An app cannot pick another query-core version than nsh-query's, nor share query-core with other npm code. Users should not install `@tanstack/query-core` alongside.
- `vendor/` is about 300 KB of generated files in the repository. Reviews skip it; the sync check guarantees what is in it.

## Alternatives considered

- **Depend on npm and publish nsh-query to npm.** Rejected: NSH apps install nshm with `nsh add`, and nshm cannot load npm packages.
- **Copy query-core's TypeScript `src/` instead of the build.** Rejected: the build is what TanStack tests and publishes; `src/` would need the same rewriting and would type check under the app's settings.
- **A fork of query-core with NSH changes.** Rejected: every upgrade would be a merge. Behavior that query-core gets wrong belongs upstream.
