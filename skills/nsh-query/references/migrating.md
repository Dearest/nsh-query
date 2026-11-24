# Migrating code to nsh-query

## From react-query

- `useQuery({ ... })` → `useQuery(() => ({ ... }))`; same for every hook's options.
- `const { data, isPending } = useQuery(...)` → `const todo = useQuery(...)`, then `todo.data`, `todo.isPending`.
- `useIsFetching()` returns an accessor: `fetching()`.
- Props/state read in options are signals or props: they update the query by themselves; no dependency arrays.
- No Suspense hooks (`useSuspenseQuery`, `usePrefetchQuery`), no `QueryErrorResetBoundary`, no `HydrationBoundary`.

## From solid-query

- Same API names and shape. Drop `reconcile`, `deferStream` and Suspense usage (`data` is a plain value, not a resource).
- The last argument is a `QueryClient`, not an accessor: `useQuery(options, queryClient)`.
- `createQuery` → `useQuery` (only `use*` names exist). `IsRestoringProvider` → `IsRestoringContext.Provider`.
- `<Show>`/`<For>` → NSH's `<If>`/`<Each>`; `createSignal` → `signal`.
