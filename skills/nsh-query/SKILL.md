---
name: nsh-query
description: Fetch, cache and update server data in NSH (nsh.dev) TSX apps with nsh-query, the TanStack Query adapter for NSH. Use when an NSH app loads data from an API, needs caching, refetching, pagination, infinite lists, mutations with optimistic updates, or persisting the cache; or when porting react-query / solid-query code to NSH.
---

# nsh-query

TanStack Query for NSH TSX apps: `useQuery`, `useMutation`, `useInfiniteQuery`, `useQueries` with query-core's caching, refetching and retries, wired to NSH's lifecycle, network and Storage.

## Install

```sh
nsh add github:Dearest/nsh-query
```

Import everything from `"nsh-query"` (persistence from `"nsh-query/persist"`). Do not install `@tanstack/query-core`: nsh-query ships its own copy, and a second one breaks focus and network handling.

## Three rules

1. **Options are a function**: `useQuery(() => ({ queryKey: ["todo", props.id], queryFn }))`. Signals and props read inside update the query.
2. **Read results by property, never destructure**: `todo.data`, `todo.isPending` in JSX, `computed` or `effect`. `const { data } = todo` reads once and never updates.
3. **Call hooks in a component body**, under a `QueryClientProvider` (or pass a `QueryClient` as the last argument).

## Setup

```tsx
import { mount } from "nsh";
import { QueryClient, QueryClientProvider } from "nsh-query";

const queryClient = new QueryClient();

mount(() => (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
));
```

The provider refetches stale queries when the app returns from the background, when the network comes back and after the system wakes.

## A query

```tsx
import { Text, View } from "nsh";
import { useQuery } from "nsh-query";

function Todo(props: { id: number }) {
  const todo = useQuery(() => ({
    queryKey: ["todos", props.id],
    queryFn: ({ signal }) => fetch(`${base}/todos/${props.id}`, { signal }).then((r) => r.json()),
  }));
  return (
    <View>
      <If when={todo.isPending}><Text>Loading</Text></If>
      <If when={todo.isError}><Text>{todo.error?.message}</Text></If>
      <Text>{todo.data?.title}</Text>
    </View>
  );
}
```

Keep the previous page while the next loads: `placeholderData: keepPreviousData` (import it from `"nsh-query"`). Poll: `refetchInterval: 5000`. Skip until ready: `enabled: props.id != null` or `queryFn: id ? fetcher : skipToken`. A page hidden but kept mounted (an inactive tab): `subscribed: props.visible` stops its fetching, polling and cache updates until it shows again.

## Shared options

```ts
import { queryOptions } from "nsh-query";

export const todoQuery = (id: number) =>
  queryOptions({ queryKey: ["todos", id], queryFn: () => fetchTodo(id) });

// useQuery(() => todoQuery(props.id)); queryClient.getQueryData(todoQuery(1).queryKey) is typed
```

## A mutation with an optimistic update

```tsx
import { useMutation, useQueryClient } from "nsh-query";

function AddTodo() {
  const queryClient = useQueryClient();
  const add = useMutation(() => ({
    mutationFn: (title: string) => postTodo(title),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old = []) => [...old, { id: -1, title }]);
      return { previous };
    },
    onError: (_error, _title, context) => queryClient.setQueryData(["todos"], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  }));
  return <View onPress={() => add.mutate("Walk the dog")}><Text>{add.isPending ? "Saving" : "Add"}</Text></View>;
}
```

## An infinite list

```tsx
const posts = useInfiniteQuery(() => ({
  queryKey: ["posts"],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.next ?? undefined,
}));
// <List each={posts.data?.pages.flatMap((p) => p.items) ?? []}
//       onLoadMore={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}>
```

## Several queries

```tsx
const users = useQueries(() => ({
  queries: props.ids.map((id) => ({ queryKey: ["users", id], queryFn: () => fetchUser(id) })),
  combine: (results) => ({ names: results.map((r) => r.data?.name), pending: results.some((r) => r.isPending) }),
}));
// users.pending, users.names: combine must return an object or an array
```

## Persisting the cache

```tsx
import { createNshStoragePersister, PersistQueryClientProvider } from "nsh-query/persist";

const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 24 * 60 * 60 * 1000 } } });

mount(() => (
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: createNshStoragePersister() }}>
    <App />
  </PersistQueryClientProvider>
));
```

`gcTime` must be at least `maxAge` (24 h by default). `useIsRestoring()` reads `true` while the cache is restored.

## Errors

`throwOnError: true` throws the error to the nearest `<ErrorBoundary>` (from `"nsh"`) around the binding that reads `data`.

## Global indicators

`useIsFetching()`, `useIsMutating()` and `useMutationState(() => ({ filters }))` return accessors: call them (`fetching() > 0`).

## Migrating from react-query

- `useQuery({ ... })` → `useQuery(() => ({ ... }))`; same for every hook's options.
- `const { data, isPending } = useQuery(...)` → `const todo = useQuery(...)`, then `todo.data`, `todo.isPending`.
- `useIsFetching()` returns an accessor: `fetching()`.
- Props/state read in options are signals or props: they update the query by themselves; no dependency arrays.
- No Suspense hooks (`useSuspenseQuery`, `usePrefetchQuery`), no `QueryErrorResetBoundary`, no `HydrationBoundary`.

## Migrating from solid-query

- Same API names and shape. Drop `reconcile`, `deferStream` and Suspense usage (`data` is a plain value, not a resource).
- The last argument is a `QueryClient`, not an accessor: `useQuery(options, queryClient)`.
- `createQuery` → `useQuery` (only `use*` names exist). `IsRestoringProvider` → `IsRestoringContext.Provider`.
- `<Show>`/`<For>` → NSH's `<If>`/`<Each>`; `createSignal` → `signal`.

## Testing an app that uses it

Open the app with a manual clock and stubbed network, and move time explicitly:

```ts
const app = await open("./App.tsx", { clock: {}, network: { "https://api.example.com/todos": { body: [] } } });
await app.clock!.runFor(1000);
```
