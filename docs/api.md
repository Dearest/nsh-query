# API

Everything is imported from `nsh-query`, except persistence, from `nsh-query/persist`. `nsh-query` also re-exports all of `@tanstack/query-core` (`QueryCache`, `keepPreviousData`, `skipToken`, `focusManager`, `hashKey`, the types, ...), whose documentation is [TanStack Query's reference](https://tanstack.com/query/latest/docs/reference/QueryClient). Each section below: signature, parameters, return value, example, and how it differs from TanStack's adapters.

Three rules hold for every hook:

1. **Options are a function.** `useQuery(() => ({ ... }))`. The signals and props it reads update the hook when they change.
2. **Read results by property, never destructure them.** `todo.data` in JSX, `computed` or `effect` is reactive; `const { data } = todo` reads once.
3. **Call hooks in a component body.** They read context and register cleanups. The last argument may be a `QueryClient`, which is then used instead of the provided one.

- [QueryClient](#queryclient)
- [QueryClientProvider](#queryclientprovider)
- [QueryClientContext](#queryclientcontext)
- [useQueryClient](#usequeryclient)
- [useQuery](#usequery)
- [useInfiniteQuery](#useinfinitequery)
- [useQueries](#usequeries)
- [useMutation](#usemutation)
- [useIsFetching](#useisfetching)
- [useIsMutating](#useismutating)
- [useMutationState](#usemutationstate)
- [queryOptions](#queryoptions)
- [infiniteQueryOptions](#infinitequeryoptions)
- [mutationOptions](#mutationoptions)
- [useIsRestoring](#useisrestoring)
- [IsRestoringContext](#isrestoringcontext)
- [connectNsh](#connectnsh)
- [createNshStoragePersister](#createnshstoragepersister) (`nsh-query/persist`)
- [PersistQueryClientProvider](#persistqueryclientprovider) (`nsh-query/persist`)
- [persistQueryClient and friends](#persistqueryclient-and-friends) (`nsh-query/persist`)
- [Types](#types)

## QueryClient

```ts
class QueryClient extends QueryCoreClient {
  constructor(config?: QueryClientConfig);
}
```

**Parameters.** `config`: `queryCache`, `mutationCache`, `defaultOptions` (`{ queries, mutations }`), as query-core's.

**Returns.** The cache and its API: `getQueryData`, `setQueryData`, `invalidateQueries`, `prefetchQuery`, `fetchQuery`, `cancelQueries`, ...

```ts
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
```

**Differences.** None: it is query-core's client. solid-query's adds the `reconcile` default option, which nsh-query does not have.

## QueryClientProvider

```ts
function QueryClientProvider(props: { client: QueryClient; children?: JSX.Element }): JSX.Element;
```

**Parameters.** `client`: read once, when the provider is created.

**Returns.** Its children, with `client` provided. While it is mounted, `client.mount()` makes the client listen to focus and connectivity, and `connectNsh()` drives them from NSH's platform signals.

```tsx
mount(() => (
  <QueryClientProvider client={queryClient}>
    <Todos />
  </QueryClientProvider>
));
```

**Differences.** Also wires NSH's platform signals (`connectNsh`). Replacing `client` on a mounted provider has no effect: mount a new provider instead.

## QueryClientContext

```ts
const QueryClientContext: Context<QueryClient | undefined>;
```

The context `useQueryClient` reads. Providing it directly (`QueryClientContext.Provider({ value, children })`) skips `client.mount()` and `connectNsh()`: call them yourself.

```tsx
function App() {
  queryClient.mount();
  cleanup(() => queryClient.unmount());
  connectNsh();
  return QueryClientContext.Provider({ value: queryClient, get children() { return <Todos />; } });
}
```

**Differences.** solid-query's context holds an accessor of the client; this one holds the client.

## useQueryClient

```ts
function useQueryClient(queryClient?: QueryClient): QueryClient;
```

**Parameters.** `queryClient`: returned as is when given.

**Returns.** The provided client. Throws `No QueryClient set, use QueryClientProvider to set one. ...` when there is none.

```ts
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ["todos"] });
```

**Differences.** None.

## useQuery

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(
  options: () => UseQueryOptions,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>; // DefinedUseQueryResult when initialData is defined
```

**Parameters.** `options`: a function returning [query options](https://tanstack.com/query/latest/docs/framework/solid/reference/useQuery) (`queryKey`, `queryFn`, `enabled`, `staleTime`, `select`, `placeholderData`, `refetchInterval`, `throwOnError`, ...). When what it reads changes, the observer gets the new options (a new `queryKey` switches queries; `placeholderData: keepPreviousData` keeps the old data meanwhile). `queryClient`: used instead of the provided one.

**Returns.** A read-only object with the query's state (`data`, `error`, `status`, `fetchStatus`, `isPending`, `isFetching`, `isStale`, ...) and `refetch`. Reading a property is reactive and tells the observer to notify on its changes only. With `throwOnError`, reading `data` throws the error to the nearest `<ErrorBoundary>`.

```tsx
function Todo(props: { id: number }) {
  const todo = useQuery(() => ({
    queryKey: ["todos", props.id],
    queryFn: ({ signal }) => fetch(`${base}/todos/${props.id}`, { signal }).then((r) => r.json()),
  }));
  return (
    <View>
      <If when={todo.isPending}><Text>Loading</Text></If>
      <Text>{todo.data?.title}</Text>
    </View>
  );
}
```

### `subscribed`

`subscribed: false` detaches the hook from the query cache. The result stays at what it was when it detached (or what the cache held when the hook mounted); nothing fetches, `refetchInterval` polling stops, updates from elsewhere (`setQueryData`, another component's fetch) do not reach it, and the query does not count it as an observer. Back to `true`, the hook subscribes again, takes the cache's current state and refetches if the data is stale, as on mount. Only the flip of `subscribed` subscribes or unsubscribes: other options can change meanwhile without attaching anything.

See react-query's [`subscribed`](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery), whose semantics these are.

It is not `enabled: false`:

| | `enabled: false` | `subscribed: false` |
|---|---|---|
| Fetches by itself | no | no |
| Shows cache updates from elsewhere | yes | no |
| Is an observer of the query | yes: the query stays in the cache while it is mounted | no: once no other observer uses it, the query is collected after `gcTime` |

Use `enabled` for "not yet" (a dependent query); use `subscribed` for a page that is hidden but stays mounted, such as an inactive tab:

```tsx
function Tabs() {
  const tab = signal<"todos" | "settings">("todos");
  return (
    <View>
      {/* Both pages stay mounted; only the visible one follows the cache. */}
      <View style={{ display: tab() === "todos" ? "flex" : "none" }}>
        <Todos visible={tab() === "todos"} />
      </View>
      <View style={{ display: tab() === "settings" ? "flex" : "none" }}>
        <Settings />
      </View>
    </View>
  );
}

function Todos(props: { visible: boolean }) {
  const todos = useQuery(() => ({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    refetchInterval: 10_000,
    subscribed: props.visible, // hidden: no polling; shown again: refetch if stale
  }));
  return <Each of={todos.data}>{(todo) => <Text>{todo().title}</Text>}</Each>;
}
```

**Differences.** As solid-query, without Suspense (no promise is thrown; `data` is not a resource), without `reconcile` and `deferStream`. The second argument is a `QueryClient`, not an accessor. Options that are not a function throw `Bad argument type`. `subscribed` is react-query's option (solid-query has none).

## useInfiniteQuery

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(
  options: () => UseInfiniteQueryOptions,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>;
```

**Parameters.** `options`: `useQuery`'s (`subscribed` included), plus `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, `maxPages`.

**Returns.** `useQuery`'s result, plus `fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, `isFetchingPreviousPage`. `data` is `{ pages, pageParams }`.

```tsx
function Posts() {
  const posts = useInfiniteQuery(() => ({
    queryKey: ["posts"],
    queryFn: ({ pageParam }) => fetch(`${base}/posts?page=${pageParam}`).then((r) => r.json()),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
  }));
  return (
    <List
      each={posts.data?.pages.flatMap((page) => page.items) ?? []}
      onLoadMore={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
    >
      {(post) => <Text>{post().title}</Text>}
    </List>
  );
}
```

**Differences.** As `useQuery`.

## useQueries

```ts
function useQueries<T extends any[], TCombinedResult extends object = QueriesResults<T>>(
  options: () => { queries: readonly [...QueriesOptions<T>]; combine?: (results: QueriesResults<T>) => TCombinedResult },
  queryClient?: QueryClient,
): TCombinedResult;
```

**Parameters.** `options().queries`: the options of each query; the list may grow and shrink. `combine`: turns the results into one value, recomputed only when a result changes. `subscribed`: `false` detaches every query of the hook, as `useQuery`'s [`subscribed`](#subscribed) (it is not accepted per query).

**Returns.** Without `combine`, a read-only array of results, each read like `useQuery`'s. With `combine`, what it returns, read-only and reactive by property.

```tsx
const users = useQueries(() => ({
  queries: props.ids.map((id) => ({ queryKey: ["users", id], queryFn: () => fetchUser(id) })),
  combine: (results) => ({ names: results.map((r) => r.data?.name), pending: results.some((r) => r.isPending) }),
}));
// <Text>{users.pending ? "Loading" : users.names.join(", ")}</Text>
```

**Differences.** `combine` must return an object or an array (it is read by property). Signals read inside `combine` are not tracked: read them in the options function.

## useMutation

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(
  options: () => UseMutationOptions,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

**Parameters.** `options`: `mutationFn`, `mutationKey`, `onMutate`, `onSuccess`, `onError`, `onSettled`, `retry`, `throwOnError`, ...

**Returns.** A read-only object with the mutation's state (`status`, `data`, `error`, `variables`, `isPending`, ...), and stable `mutate` (errors go to the state), `mutateAsync` (returns a promise) and `reset`. With `throwOnError`, an error throws to the nearest `<ErrorBoundary>`.

```tsx
function AddTodo() {
  const queryClient = useQueryClient();
  const add = useMutation(() => ({
    mutationFn: (title: string) => fetch(`${base}/todos`, { method: "POST", body: JSON.stringify({ title }) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  }));
  return <View onPress={() => add.mutate("Walk the dog")}><Text>{add.isPending ? "Saving" : "Add"}</Text></View>;
}
```

**Differences.** None beyond the rules above.

## useIsFetching

```ts
function useIsFetching(filters?: () => QueryFilters, queryClient?: QueryClient): Accessor<number>;
```

**Returns.** An accessor of how many queries matching `filters` are fetching.

```tsx
const fetching = useIsFetching();
// <If when={fetching() > 0}><Text>Refreshing</Text></If>
```

**Differences.** As solid-query: an accessor, filters as a function.

## useIsMutating

```ts
function useIsMutating(filters?: () => MutationFilters, queryClient?: QueryClient): Accessor<number>;
```

**Returns.** An accessor of how many mutations matching `filters` are running.

```tsx
const saving = useIsMutating(() => ({ mutationKey: ["todos"] }));
```

**Differences.** As solid-query.

## useMutationState

```ts
function useMutationState<TResult = MutationState>(
  options?: () => { filters?: MutationFilters; select?: (mutation: Mutation) => TResult },
  queryClient?: QueryClient,
): Accessor<TResult[]>;
```

**Returns.** An accessor of the matching mutations' state (or what `select` takes from each), following the cache; unchanged entries keep their identity.

```tsx
const pendingTitles = useMutationState(() => ({
  filters: { mutationKey: ["todos", "add"], status: "pending" },
  select: (mutation) => mutation.state.variables as string,
}));
// <Each of={pendingTitles()}>{(title) => <Text>{title()}</Text>}</Each>
```

**Differences.** As solid-query.

## queryOptions

```ts
function queryOptions(options: QueryOptions): QueryOptions & { queryKey: DataTag<...> };
```

Returns `options` as they are, typed so that the `queryKey` carries the data type.

```ts
const todoOptions = (id: number) => queryOptions({ queryKey: ["todos", id], queryFn: () => fetchTodo(id) });
const todo = useQuery(() => todoOptions(props.id));
const cached = queryClient.getQueryData(todoOptions(1).queryKey); // Todo | undefined
```

**Differences.** None.

## infiniteQueryOptions

```ts
function infiniteQueryOptions(options: InfiniteQueryOptions): InfiniteQueryOptions & { queryKey: DataTag<...> };
```

As `queryOptions`, for `useInfiniteQuery` and `queryClient.prefetchInfiniteQuery`.

```ts
const postsOptions = infiniteQueryOptions({
  queryKey: ["posts"],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.next ?? undefined,
});
```

**Differences.** None.

## mutationOptions

```ts
function mutationOptions(options: MutationOptions): MutationOptions;
```

Returns `options` as they are, typed, to share between `useMutation`, `useMutationState`'s filters and `queryClient.setMutationDefaults`.

```ts
const addTodo = mutationOptions({ mutationKey: ["todos", "add"], mutationFn: (title: string) => postTodo(title) });
const add = useMutation(() => addTodo);
```

**Differences.** None.

## useIsRestoring

```ts
function useIsRestoring(): Accessor<boolean>;
```

**Returns.** An accessor that reads `true` while `PersistQueryClientProvider` restores the saved cache.

```tsx
const restoring = useIsRestoring();
// <If when={restoring()}><Text>Restoring</Text></If>
```

**Differences.** None.

## IsRestoringContext

```ts
const IsRestoringContext: Context<Accessor<boolean>>;
```

What `useIsRestoring` reads (default: `() => false`). While it reads `true`, queries neither subscribe nor fetch. `PersistQueryClientProvider` provides it; provide it yourself for a restore of your own.

```tsx
IsRestoringContext.Provider({ value: restoring, get children() { return <Todos />; } });
```

**Differences.** solid-query exports `IsRestoringProvider`; here the context itself is exported, as NSH contexts carry their `Provider`.

## connectNsh

```ts
function connectNsh(options?: { focused?: (state: "active" | "inactive" | "background") => boolean }): void;
```

Connects query-core to NSH's platform signals, in a component body: `lifecycle()` sets the focus (by default, focused unless `"background"`), `network().online` the connection, and each wake from sleep (`wakeCount()`) counts as coming back. `QueryClientProvider` calls it.

```tsx
connectNsh({ focused: (state) => state === "active" }); // inactive windows stop polling too
```

**Differences.** NSH only. In browsers, TanStack listens to `visibilitychange` and `online`/`offline`; nsh-query turns those listeners off (`docs/adr/0003-focus-semantics.md`).

## createNshStoragePersister

```ts
import { createNshStoragePersister } from "nsh-query/persist";

function createNshStoragePersister(options?: {
  key?: string;          // "nsh-query"
  throttleTime?: number; // 1000
  retry?: AsyncPersistRetryer; // removeOldestQuery
  serialize?: (client: PersistedClient) => string | Promise<string>;
  deserialize?: (cached: string) => PersistedClient | Promise<PersistedClient>;
}): Persister;
```

A persister saving the cache in NSH's `Storage` (5 MB, kept across launches): TanStack's `createAsyncStoragePersister` on `Storage`. When `Storage` is full (`ERR_NSH_QUOTA_EXCEEDED`), `removeOldestQuery` drops the oldest query and tries again.

```ts
const persister = createNshStoragePersister({ key: "todos-app" });
```

**Differences.** NSH only; the same as `createAsyncStoragePersister({ storage: Storage, retry: removeOldestQuery })`.

## PersistQueryClientProvider

```ts
import { PersistQueryClientProvider } from "nsh-query/persist";

function PersistQueryClientProvider(props: {
  client: QueryClient;
  persistOptions: { persister: Persister; maxAge?: number; buster?: string; dehydrateOptions?; hydrateOptions? };
  onSuccess?: () => unknown;
  onError?: () => unknown;
  children?: JSX.Element;
}): JSX.Element;
```

`QueryClientProvider` that first restores the saved cache, then saves it as it changes. While restoring, `useIsRestoring()` is `true` and queries wait. Saved caches older than `maxAge` (24 hours) or with another `buster` are dropped. Give queries a `gcTime` of at least `maxAge`, or restored queries are collected at once.

```tsx
const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 24 * 60 * 60 * 1000 } } });

mount(() => (
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: createNshStoragePersister() }}>
    <Todos />
  </PersistQueryClientProvider>
));
```

**Differences.** As solid-query's. `Storage` is asynchronous, so the first frame shows the restoring state; restored data shows as soon as `Storage` answers, without a request.

## persistQueryClient and friends

`persistQueryClient`, `persistQueryClientRestore`, `persistQueryClientSave`, `persistQueryClientSubscribe` and `removeOldestQuery` are re-exported from `@tanstack/query-persist-client-core`, for restoring and saving without the provider. See [TanStack's persistQueryClient](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient).

```ts
const persister = createNshStoragePersister();
const [unsubscribe, restored] = persistQueryClient({ queryClient, persister });
await restored;
```

## Types

`UseQueryOptions`, `UseQueryResult`, `DefinedUseQueryResult`, `UseInfiniteQueryOptions`, `UseInfiniteQueryResult`, `DefinedUseInfiniteQueryResult`, `UseMutationOptions`, `UseMutationResult`, `UseMutateFunction`, `UseMutateAsyncFunction`, `QueryOptions`, `InfiniteQueryOptions`, `MutationOptions`, `QueryClientProviderProps`, `ConnectNshOptions`, `MutationStateOptions`, `QueriesOptions`, `QueriesResults`, `DefinedInitialDataOptions`, `UndefinedInitialDataOptions`, `DefinedInitialDataInfiniteOptions`, `UndefinedInitialDataInfiniteOptions`; from `nsh-query/persist`: `NshStoragePersisterOptions`, `PersistQueryClientProviderProps`, `Persister`, `PersistedClient`, `PersistQueryClientOptions`. The `Use*Options` types are functions returning the options, as solid-query's.
