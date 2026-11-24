# Contributing

Thanks for helping. This page is all you need to add a feature, run the checks and open a pull request; `AGENTS.md` says the same for coding agents, with the repository map.

## Setup

- NSH nightly: `curl -fsSL https://nsh.dev/install.sh | sh -s -- --nightly` (then `~/.nsh/bin` on your `PATH`).
- Node 20 or newer, for the scripts in `scripts/`.
- Then, from the repository root:

```sh
scripts/check.sh
```

It checks `vendor/` against a fresh sync, that every export has a test, that `tests/PARITY.md` points to real tests, then runs `nsh check` and `nsh test` in `tests/` and `example/`. CI runs the same script on macOS and Linux: green locally means green in CI. Run one test file with `cd tests && nsh test useQuery.test.tsx` (`--filter <name>` for some of its tests).

## What gets in: scope rules

1. **An API an official TanStack adapter has** (react, solid, vue, svelte, angular) and nsh-query lacks: open a pull request directly, implementing the official semantics. solid-query's shape wins when they differ (`docs/adr/0001-alignment-layers.md`).
2. **Something of NSH's own** (wiring a new platform signal, a persistence backend, an integration with an NSH component): open a **Feature proposal** issue first. A maintainer labels it `accepted`; then open the pull request.
3. **Caching, retries, deduplication, staleness**: that is query-core, which nsh-query runs unmodified. Propose it to [TanStack/query](https://github.com/TanStack/query). Pull requests editing `vendor/` are not accepted.

Questions and ideas go to Discussions; issues are for bugs and proposals.

## Adding a feature

The pull request template has these as a checklist:

1. **Source.** `src/<name>.ts` with one public export, exported from `src/index.ts` (or `src/persist/index.ts`). TSDoc on the export, with an example. No JSX in `src/`, and only erasable TypeScript (no `enum`, parameter properties or `namespace`): NSH strips types without transforming. Import query-core things from `./core`, never from `vendor/`.
2. **Tests.** A fixture `tests/fixtures/<name>/<scenario>.tsx` (an entry that calls `mount`) and cases in `tests/<name>.test.tsx`. A test cannot reach into the app: render what you assert as `<Text>`, read it with `app.texts()`, and check `app.requests()` or `app.storage()`. Always open with a manual clock and stubbed network: `open(entry, { clock: {}, network: { ... } })`, and move time with `app.clock.runFor(ms)`.
3. **Types.** Add the export to the import and the `values` list in `tests/types/public-api.ts`. Public types of its own get cases in `tests/types/<name>.ts`, with `// @ts-expect-error` on misuse.
4. **API surface.** Add the export's name to its entry's array in `tests/api-surface.json`, in alphabetical order; `tests/api-surface.test.tsx` fails until the file matches the runtime exports.
5. **Docs.** A section in `docs/api.md` (signature, parameters, return, example, differences from TanStack) and a line in the contents list at its top. A behavior that differs from TanStack's documentation goes into `docs/differences.md`.
6. **Decisions.** A design decision gets a page in `docs/adr/` (context, decision, alternatives); a change to an existing decision updates its page in the same pull request.
7. `scripts/check.sh` passes.

If the feature relies on a query-core member that is not documented API (as `trackProp` or `_optimisticResults`), add a check to `tests/fixtures/core-contract/contract.tsx` and its name to `tests/core-contract.test.tsx`, so that an upgrade breaking it says so.

## Upstream parity

`tests/PARITY.md` lists every upstream test of solid-query's and react-query's hooks: ported (with the nsh-query test that checks it), not applicable, or behaving differently on NSH. Porting a case, or reviewing a "not applicable", is a good first issue. Ported tests use the harness in `tests/support/parity.tsx`: one fixture holds many scenarios, chosen with `openScenario(entry, name)`.

## Commits, pull requests and releases

- Pull request titles are [Conventional Commits](https://www.conventionalcommits.org): `feat: add useSomething`, `fix(persist): ...`, `docs: ...`. CI checks the title. Pull requests are squashed, so the title is the commit.
- Do not change `nsh.json`'s `version` or `CHANGELOG.md`: release-please keeps a release pull request that does, and merging it tags `v<version>`.
- Versions follow SemVer; while at 0.x, a minor version may break. A query-core upgrade is `fix(core):` (patch) or `feat(core):`.
- Write code, comments and docs in English.

## Reviews

A maintainer answers within 7 days. Issues labelled `good first issue` and `help wanted` are ready to take: comment that you are on it.

By contributing you agree that your contribution is licensed under the MIT license, and to follow the [code of conduct](CODE_OF_CONDUCT.md).
