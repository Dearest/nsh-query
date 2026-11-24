# nsh-query

[TanStack Query](https://tanstack.com/query) for [NSH](https://nsh.dev) apps: fetch, cache and update server data with `useQuery`, `useMutation` and friends, wired to NSH's lifecycle, network and `Storage`.

The cache engine is `@tanstack/query-core`, unmodified. nsh-query is the adapter: hooks shaped like [solid-query](https://tanstack.com/query/latest/docs/framework/solid/overview)'s, the platform wiring, and a persistence preset. solid-query's documentation applies, with the differences listed below.

> nsh-query is a community project. It is not affiliated with or endorsed by TanStack or the NSH project.

## Install

```sh
nsh add github:Dearest/nsh-query
```

Import from `nsh-query` (and `nsh-query/persist`). Do not install `@tanstack/query-core` next to it: nsh-query ships its own copy, and a second one would not get the platform wiring.

## Example

```tsx
import { mount, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";

const queryClient = new QueryClient();

function Todo(props: { id: number }) {
  const todo = useQuery(() => ({
    queryKey: ["todos", props.id],
    queryFn: ({ signal }) =>
      fetch(`https://jsonplaceholder.typicode.com/todos/${props.id}`, { signal }).then((r) => r.json()),
  }));
  return (
    <View>
      <If when={todo.isPending}>
        <Text>Loading</Text>
      </If>
      <Text>{todo.data?.title}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={queryClient}>
    <Todo id={1} />
  </QueryClientProvider>
));
```

Leave a page and come back: its first frame already shows the cached data, without a new request. Stale data refreshes in the background, and again when the app returns to the foreground, the network comes back or the computer wakes from sleep.

`example/` is a complete app: a list and its details, polling, an optimistic update, an infinite feed and a persisted cache, on an in-memory fake API (`cd example && nsh run`).

## Rules

NSH components run once; only what reads a signal runs again. Hence three rules, the same as solid-query's:

1. **Options are a function**: `useQuery(() => ({ queryKey: ["todos", props.id], ... }))`. The props and signals read inside update the query: a new key switches to it, keeping the observer.
2. **Read results by property, never destructure them**: `todo.data`, `todo.isFetching`, `todo.refetch()`. Read in JSX, `computed` or `effect`, a property is reactive; `const { data } = todo` in the component body reads it once.
3. **Call hooks in a component body**, under a `QueryClientProvider`. Or pass a `QueryClient` as the last argument (`useQuery(options, queryClient)`); then, without a provider, call `queryClient.mount()`, `cleanup(() => queryClient.unmount())` and `connectNsh()` in your root component yourself.

## Platform behavior

`QueryClientProvider` connects query-core to NSH's platform signals:

| NSH | query-core | Effect |
|---|---|---|
| `lifecycle()` is `"background"` | unfocused | `refetchInterval` polling and retries pause (unless `refetchIntervalInBackground`) |
| `lifecycle()` back from `"background"` | focused | stale queries refetch (`refetchOnWindowFocus`) |
| `lifecycle()` is `"inactive"` (visible, another window has the focus) | still focused | polling goes on, as in a visible browser tab |
| `wakeCount()` grows (the computer woke up) | a return to focus | stale queries refetch |
| `network().online` false / true | offline / online | fetches pause, then resume (`refetchOnReconnect`) |

`connectNsh({ focused: (state) => state === "active" })` counts `"inactive"` as unfocused too. On desktops, every `<Window>` of an app runs on the app's one engine: one `QueryClient` serves all windows, and they share its cache.

## Persistence

```tsx
import { QueryClient } from "nsh-query";
import { createNshStoragePersister, PersistQueryClientProvider } from "nsh-query/persist";

const day = 24 * 60 * 60 * 1000;
const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: day } } });

mount(() => (
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: createNshStoragePersister(), maxAge: day }}>
    <App />
  </PersistQueryClientProvider>
));
```

The cache is saved in NSH's `Storage` (kept across launches, 5 MB) at most once a second, and restored at the next launch: restored data shows without a request. While restoring, `useIsRestoring()` reads `true` and queries wait. When `Storage` is full, the oldest queries are left out (`removeOldestQuery`).

**Set `gcTime` to at least `maxAge`** (24 hours by default): queries collected from the cache are not saved, and restored queries with a shorter `gcTime` are collected again right away. A different `buster` drops the saved cache, for when its shape changes.

## Compatibility

| nsh-query | NSH | query-core |
|---|---|---|
| 0.1 | 0.6 nightly (from 2026-11-22) | 5.108.4 |

The query-core version is in `vendor/VERSIONS.json`. A weekly job proposes each new query-core release ([docs/upgrading-query-core.md](docs/upgrading-query-core.md)).

## Differences from TanStack Query's documentation

The details are in [docs/differences.md](docs/differences.md). In short:

- No Suspense, no SSR or hydration, no `reconcile` (solid) and no React-only APIs (`useSuspenseQuery`, `usePrefetchQuery`, `QueryErrorResetBoundary`, `HydrationBoundary`).
- Options are functions and results are read by property (as solid-query); the last argument is a `QueryClient`, not an accessor.
- Only `use*` names (no `create*` aliases).
- Focus is "not in the background", from `lifecycle()`; network from `network()`.
- `throwOnError` throws when `data` is read, to the nearest `<ErrorBoundary>`.
- `useQueries`' `combine` returns an object or an array.
- react-query's `subscribed` option is there too, for pages hidden but kept mounted.

## Documentation

- [docs/api.md](docs/api.md): every export, with its signature and an example.
- [docs/differences.md](docs/differences.md): every difference from solid-query and react-query.
- [docs/upgrading-query-core.md](docs/upgrading-query-core.md): how query-core upgrades work.
- [docs/adr/](docs/adr): the design decisions.
- [tests/PARITY.md](tests/PARITY.md): every upstream test of solid-query and react-query, and the nsh-query test that ports it.
- [skills/nsh-query/SKILL.md](skills/nsh-query/SKILL.md): for coding agents writing apps with nsh-query (`npx skills add Dearest/nsh-query`).
- [CONTRIBUTING.md](CONTRIBUTING.md): how to add a feature and open a pull request; [AGENTS.md](AGENTS.md) for coding agents working on this repository.

## License

MIT, © Dearest. Includes TanStack Query (MIT): see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
