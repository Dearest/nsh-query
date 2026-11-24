# Differences from solid-query and react-query

nsh-query takes its API shape from `@tanstack/solid-query`, its implementation from `@tanstack/react-query`'s `useBaseQuery`, and its behavior from `@tanstack/query-core`, unmodified (`docs/adr/0001-alignment-layers.md`). This page lists every place where code or documentation written for solid-query or react-query does not apply as is.

## API

| | solid-query | react-query | nsh-query |
|---|---|---|---|
| Options | a function | an object | a function: `useQuery(() => ({ ... }))`. Anything else throws `Bad argument type` |
| Result | a store, read by property | a plain object, destructured | a read-only proxy, read by property; do not destructure it |
| Last argument | an accessor of a client | a client | a client, read once |
| Names | `use*`, with `create*` aliases | `use*` | `use*` only |
| `useIsFetching`, `useIsMutating`, `useMutationState` | accessors | values | accessors, with filters as functions |
| Restoring provider | `IsRestoringProvider` | `IsRestoringProvider` | `IsRestoringContext` (use `IsRestoringContext.Provider`) |
| `QueryClientContext` value | an accessor of the client | the client | the client |
| `useQueries` `combine` | any value | any value | an object or an array (the result is read by property) |
| `subscribed` option | no | yes | no |
| Missing client | "No QueryClient set, use QueryClientProvider to set one" | same | same text, followed by how to fix it |

## Not available

- **Suspense**: no `useSuspenseQuery`, `useSuspenseInfiniteQuery`, `useSuspenseQueries`, `usePrefetchQuery`, `usePrefetchInfiniteQuery`; no promise is thrown, `suspense: true` and `query.promise` with `use()` do nothing special. NSH has no Suspense.
- **SSR and hydration**: no `HydrationBoundary`, no `deferStream`, no server rendering. `dehydrate` and `hydrate` (from query-core) still work on a client, as `nsh-query/persist` uses them.
- **solid's `reconcile` option**: results keep query-core's `structuralSharing` (on by default), which keeps unchanged parts of `data` identical, as `<Each>` needs.
- **`QueryErrorResetBoundary` / `useQueryErrorResetBoundary`** (react): NSH's `<ErrorBoundary>` has its own `reset`. Without a reset boundary, a query that threw to a boundary retries when its component mounts again (react-query turns `retryOnMount` off until the boundary resets).
- **Devtools.**

## Behavior

- **Focus** comes from `lifecycle()`: focused unless `"background"`. A visible window without the focus (`"inactive"`) keeps polling, like a visible browser tab. Waking from sleep counts as coming back. `connectNsh({ focused })` changes the rule (`docs/adr/0003-focus-semantics.md`). Mounting the app does not count as a return to it.
- **Online** comes from `network().online`; the `window` listeners query-core installs in browsers are turned off, also on `--target web`.
- **`isServer`** is forced to `false` when `nsh-query` is imported: query-core would take NSH, which has no `window`, for a server (no polling, no stale timers, no retries). The `isServer` constant query-core exports is not affected and reads `true`; use `environmentManager.isServer()`.
- **`throwOnError`** throws when `data` is read, to the nearest `<ErrorBoundary>` around that binding (solid-query's behavior). `status` and `error` read elsewhere still show the error. react-query throws from the whole component render instead.
- **Updates are batched** with NSH's `batch`: one query update runs an effect that reads several results once. A notification with the same values as the current result runs nothing.
- **Granularity**: a binding re-runs when a property its result tracks changes. A binding reading only `data` does not run again when only `isFetching` flips, as long as nothing else reads `isFetching` from the same result; if something does, the `data` binding runs again with the same value (`docs/adr/0005-proxy-result.md`).
- **`combine`** in `useQueries` runs outside tracking: signals read inside it are not followed. Read them in the options function and close over the value.
- **Providers read their props once**: changing `client` (or `persistOptions`) of a mounted `QueryClientProvider` or `PersistQueryClientProvider` has no effect; mount a new one.
- **Persistence**: NSH's `Storage` is asynchronous, so the first frame of a launch shows the restoring state (`useIsRestoring()` is `true`); the restored data follows as soon as `Storage` answers, without a request.

## Platforms

- **Desktop windows** share one engine: every `<Window>` of an app runs on the app's one JS engine, so one `QueryClient` serves all of them and they share its cache. Checked headless and on macOS.
- **`--target web`** is not verified yet: the pinned NSH nightly cannot install a matching web runtime. Until it is, web is not part of CI.

## Upstream tests that behave differently

The cases of `tests/PARITY.md` marked "NSH differs", grouped by reason. Each has an nsh-query test asserting what NSH does.

- **react-query › useMutationState › should read from a changed custom queryClient**, **solid-query › useIsFetching › should resubscribe when a custom queryClient changes**, **solid-query › useIsMutating › should resubscribe when a custom queryClient changes**: useIsFetching, useIsMutating and useMutationState take the queryClient as a plain QueryClient argument that is read once when the hook is called, not an accessor, so the client of a mounted component cannot change. Switching clients means mounting the component again with the other client: the old component unsubscribes from the first cache (its listener is removed) and the new one reads the second.
- **react-query › useQueries › should not re-render if combine returns a stable reference**: nsh-query's useQueries returns a reactive read-only view of what combine returns, so combine must return an object or an array; upstream's combine returns the string 'foo'. The port returns a constant object { value: 'foo' } and reads data.value. With that wrapping NSH matches upstream: the queries resolve and an effect reading the combined value runs once, because the combined value keeps its reference.
- **react-query › useQueries › should re-render once combine returns a different reference**: nsh-query's useQueries returns a reactive read-only view of what combine returns, so combine must return an object or an array; upstream's combine returns the strings 'pending' and 'foo'. The port returns { value: 'pending' } or { value: 'foo' } and reads data.value. Structural sharing keeps equal results as one reference, so an effect reading the combined value runs twice (pending, then foo), as upstream renders twice.
- **react-query › useQueries › should track properties correctly with combine**: nsh-query's useQueries returns a reactive read-only view of what combine returns, so combine must return an object or an array; upstream's combine returns 'pending' or the joined data string. The port returns { value: 'pending' } or { value: <joined data> } and reads data.value. Property tracking through combine then behaves as upstream: setQueryData on the first query updates the combined value.
- **react-query › useQuery › should throw error if queryFn rejects with a falsy error and throwOnError is in use**: With `throwOnError`, react-query throws the query's error (here a falsy one) during the render of any component that uses the query, even one that reads only `status`. nsh-query throws it where `data` is read, as solid-query does: a component that reads only `status` or `error` keeps rendering and shows the error status, and one that reads `data` sends the error, falsy or not, to the nearest ErrorBoundary.
- **react-query › useQuery › should not cause memo churn when data does not change**, **solid-query › useQuery › should not cause memo churn when data does not change**: A `computed` that reads `result.data` depends on the whole result object, so its body runs again each time the component is notified of any field it reads (here `status` and `isFetching` too): 4 runs instead of upstream's 2. Its value is compared, so what depends on the computed runs only when `data` changes (2 runs, as upstream's memo), which is what the upstream test protects.
- **react-query › useQuery › should not retry on mount when throwOnError function returns true**: react-query turns `retryOnMount` off for a query whose error an error boundary has shown (`throwOnError`), until a `QueryErrorResetBoundary` resets it, so a component mounted again shows the error without fetching. nsh-query has no reset boundary and leaves `retryOnMount` as given: a component mounted again under an ErrorBoundary retries the failed query (with the default `retryOnMount: true`), and the boundary shows the error again if that fetch fails too. Set `retryOnMount: false` to keep react-query's behavior.
- **solid-query › useQuery › should share equal data structures between query results**: nsh-query has no `reconcile` option: data is shared structurally by query-core (replaceEqualDeep), so after a refetch the unchanged todo keeps its identity while the changed todo and the array are new objects. Solid's reconcile keeps the changed todo's object too and updates it in place. The test asserts React's structural sharing.
