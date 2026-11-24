# Upstream parity

Every test case of `@tanstack/solid-query` and `@tanstack/react-query` 5.108.4 for the hooks (`packages/*/src/__tests__/use*.test.tsx`, and `QueryClientProvider.test.tsx`), one row each, in upstream order:

- **ported**: the behavior means the same on NSH; the named nsh-query test checks it.
- **not applicable**: it cannot mean anything on NSH (Suspense, SSR, solid's `reconcile`, React-only machinery, APIs nsh-query does not have, assertions on console output).
- **NSH differs**: NSH behaves differently for a reason given in `docs/differences.md`; the named test checks what NSH does.

A react-query case with the same name as a solid-query one usually points to the same test. The tests are `tests/<topic>.parity*.test.tsx`, their scenarios `tests/fixtures/<topic>/parity*.tsx`. `scripts/check-parity.mjs` (run by `scripts/check.sh`) checks that every named test exists.

Counts: ported 499, NSH differs 11, not applicable 80 (590 upstream cases).

Porting a row marked not applicable that you think is applicable, or a new upstream case, is a good first contribution: see `CONTRIBUTING.md`.

## react-query › QueryClientProvider.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| QueryClientProvider › should set a specific cache for all queries to use | ported | `QueryClientProvider.parity.test.tsx` › should set a specific cache for all queries to use |
| QueryClientProvider › should allow multiple caches to be partitioned | ported | `QueryClientProvider.parity.test.tsx` › should allow multiple caches to be partitioned |
| QueryClientProvider › should use defaultOptions for queries when they don't provide their own config | ported | `QueryClientProvider.parity.test.tsx` › should use defaultOptions for queries when they don't provide their own config |
| QueryClientProvider › useQueryClient › should throw an error if no query client has been set | ported | `QueryClientProvider.parity.test.tsx` › should throw an error if no query client has been set |

## react-query › useInfiniteQuery.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useInfiniteQuery › should return the correct states for a successful query | ported | `useInfiniteQuery.parity.test.tsx` › should return the correct states for a successful query |
| useInfiniteQuery › should not throw when fetchNextPage returns an error | ported | `useInfiniteQuery.parity.test.tsx` › should not throw when fetchNextPage returns an error |
| useInfiniteQuery › should keep the previous data when placeholderData is set | ported | `useInfiniteQuery.parity.test.tsx` › should keep the previous data when placeholderData is set |
| useInfiniteQuery › should be able to select a part of the data | ported | `useInfiniteQuery.parity.test.tsx` › should be able to select a part of the data |
| useInfiniteQuery › should be able to select a new result and not cause infinite renders | ported | `useInfiniteQuery.parity.test.tsx` › should be able to select a new result and not cause infinite renders |
| useInfiniteQuery › should be able to reverse the data | ported | `useInfiniteQuery.parity.test.tsx` › should be able to reverse the data |
| useInfiniteQuery › should be able to fetch a previous page | ported | `useInfiniteQuery.parity.test.tsx` › should be able to fetch a previous page |
| useInfiniteQuery › should be able to refetch when providing page params automatically | ported | `useInfiniteQuery.parity.test.tsx` › should be able to refetch when providing page params automatically |
| useInfiniteQuery › should return the correct states when refetch fails | ported | `useInfiniteQuery.parity.test.tsx` › should return the correct states when refetch fails |
| useInfiniteQuery › should return the correct states when fetchNextPage fails | ported | `useInfiniteQuery.parity.test.tsx` › should return the correct states when fetchNextPage fails |
| useInfiniteQuery › should return the correct states when fetchPreviousPage fails | ported | `useInfiniteQuery.parity.test.tsx` › should return the correct states when fetchPreviousPage fails |
| useInfiniteQuery › should silently cancel any ongoing fetch when fetching more | ported | `useInfiniteQuery.parity.test.tsx` › should silently cancel any ongoing fetch when fetching more |
| useInfiniteQuery › should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked | ported | `useInfiniteQuery.parity.test.tsx` › should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked |
| useInfiniteQuery › should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used | ported | `useInfiniteQuery.parity.test.tsx` › should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used |
| useInfiniteQuery › should keep fetching first page when not loaded yet and triggering fetch more | ported | `useInfiniteQuery.parity.test.tsx` › should keep fetching first page when not loaded yet and triggering fetch more |
| useInfiniteQuery › should stop fetching additional pages when the component is unmounted and AbortSignal is consumed | ported | `useInfiniteQuery.parity.test.tsx` › should stop fetching additional pages when the component is unmounted and AbortSignal is consumed |
| useInfiniteQuery › should be able to set new pages with the query client | ported | `useInfiniteQuery.parity.test.tsx` › should be able to set new pages with the query client |
| useInfiniteQuery › should only refetch the first page when initialData is provided | ported | `useInfiniteQuery.parity.test.tsx` › should only refetch the first page when initialData is provided |
| useInfiniteQuery › should keep initialData visible alongside the error when a refetch fails | ported | `useInfiniteQuery.parity.test.tsx` › should keep initialData visible alongside the error when a refetch fails |
| useInfiniteQuery › should set hasNextPage to false if getNextPageParam returns undefined | ported | `useInfiniteQuery.parity.test.tsx` › should set hasNextPage to false if getNextPageParam returns undefined |
| useInfiniteQuery › should compute hasNextPage correctly using initialData | ported | `useInfiniteQuery.parity.test.tsx` › should compute hasNextPage correctly using initialData |
| useInfiniteQuery › should compute hasNextPage correctly for falsy getFetchMore return value using initialData | ported | `useInfiniteQuery.parity.test.tsx` › should compute hasNextPage correctly for falsy getFetchMore return value using initialData |
| useInfiniteQuery › should not use selected data when computing hasNextPage | ported | `useInfiniteQuery.parity.test.tsx` › should not use selected data when computing hasNextPage |
| useInfiniteQuery › should build fresh cursors on refetch | ported | `useInfiniteQuery.parity.test.tsx` › should build fresh cursors on refetch |
| useInfiniteQuery › should compute hasNextPage correctly for falsy getFetchMore return value on refetching | ported | `useInfiniteQuery.parity.test.tsx` › should compute hasNextPage correctly for falsy getFetchMore return value on refetching |
| useInfiniteQuery › should cancel the query function when there are no more subscriptions | ported | `useInfiniteQuery.parity.test.tsx` › should cancel the query function when there are no more subscriptions |
| useInfiniteQuery › should use provided custom queryClient | ported | `useInfiniteQuery.parity.test.tsx` › should use provided custom queryClient |
| useInfiniteQuery › should not fetch when queryFn is skipToken, and fetch once it is replaced | ported | `useInfiniteQuery.parity.test.tsx` › should not fetch when queryFn is skipToken, and fetch once it is replaced |

## react-query › useIsFetching.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useIsFetching › should update as queries start and stop fetching | ported | `useIsFetching.parity.test.tsx` › should update as queries start and stop fetching |
| useIsFetching › should not update state while rendering | ported | `useIsFetching.parity.test.tsx` › should not update state while rendering |
| useIsFetching › should be able to filter | ported | `useIsFetching.parity.test.tsx` › should be able to filter |
| useIsFetching › should show the correct fetching state when mounted after a query | ported | `useIsFetching.parity.test.tsx` › should show the correct fetching state when mounted after a query |
| useIsFetching › should use provided custom queryClient | ported | `useIsFetching.parity.test.tsx` › should use provided custom queryClient |

## react-query › useMutation.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useMutation › should be able to reset `data` | ported | `useMutation.parity.test.tsx` › should be able to reset `data` |
| useMutation › should be able to reset `error` | ported | `useMutation.parity.test.tsx` › should be able to reset `error` |
| useMutation › should call mutate callbacks when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call mutate callbacks when useMutation has no callbacks |
| useMutation › should call mutateAsync callbacks when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call mutateAsync callbacks when useMutation has no callbacks |
| useMutation › should call mutate error callbacks when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call mutate error callbacks when useMutation has no callbacks |
| useMutation › should call mutateAsync error callbacks when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call mutateAsync error callbacks when useMutation has no callbacks |
| useMutation › should call only mutate onSuccess when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutate onSuccess when useMutation has no callbacks |
| useMutation › should call only mutate onError when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutate onError when useMutation has no callbacks |
| useMutation › should call only mutate onSettled when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutate onSettled when useMutation has no callbacks |
| useMutation › should call only mutateAsync onSuccess when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutateAsync onSuccess when useMutation has no callbacks |
| useMutation › should call only mutateAsync onError when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutateAsync onError when useMutation has no callbacks |
| useMutation › should call only mutateAsync onSettled when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutateAsync onSettled when useMutation has no callbacks |
| useMutation › should be able to call `onSuccess` and `onSettled` after each successful mutate | ported | `useMutation.parity.test.tsx` › should be able to call `onSuccess` and `onSettled` after each successful mutate |
| useMutation › should set correct values for `failureReason` and `failureCount` on multiple mutate calls | ported | `useMutation.parity.test.tsx` › should set correct values for `failureReason` and `failureCount` on multiple mutate calls |
| useMutation › should be able to call `onError` and `onSettled` after each failed mutate | ported | `useMutation.parity.test.tsx` › should be able to call `onError` and `onSettled` after each failed mutate |
| useMutation › should be able to call `onSuccess` callback after successful mutate | ported | `useMutation.parity-b.test.tsx` › should be able to call `onSuccess` callback after successful mutate |
| useMutation › should be able to call `onError` callback after failed mutate | ported | `useMutation.parity-b.test.tsx` › should be able to call `onError` callback after failed mutate |
| useMutation › should be able to call `onSettled` callback after mutate | ported | `useMutation.parity-b.test.tsx` › should be able to call `onSettled` callback after mutate |
| useMutation › should be able to call `onSuccess` callback after successful mutateAsync | ported | `useMutation.parity-b.test.tsx` › should be able to call `onSuccess` callback after successful mutateAsync |
| useMutation › should be able to call `onError` callback after failed mutateAsync | ported | `useMutation.parity-b.test.tsx` › should be able to call `onError` callback after failed mutateAsync |
| useMutation › should be able to call `onSettled` callback after mutateAsync | ported | `useMutation.parity-b.test.tsx` › should be able to call `onSettled` callback after mutateAsync |
| useMutation › should be able to override the useMutation success callbacks | ported | `useMutation.parity.test.tsx` › should be able to override the useMutation success callbacks |
| useMutation › should be able to override the error callbacks when using mutateAsync | ported | `useMutation.parity.test.tsx` › should be able to override the error callbacks when using mutateAsync |
| useMutation › should be able to override the error callbacks when using mutate | ported | `useMutation.parity-b.test.tsx` › should be able to override the error callbacks when using mutate |
| useMutation › should be able to override the settled callbacks when using mutate | ported | `useMutation.parity-b.test.tsx` › should be able to override the settled callbacks when using mutate |
| useMutation › should be able to use mutation defaults | ported | `useMutation.parity.test.tsx` › should be able to use mutation defaults |
| useMutation › should be able to retry a failed mutation | ported | `useMutation.parity.test.tsx` › should be able to retry a failed mutation |
| useMutation › should not retry mutations while offline | ported | `useMutation.parity.test.tsx` › should not retry mutations while offline |
| useMutation › should call onMutate even if paused | ported | `useMutation.parity.test.tsx` › should call onMutate even if paused |
| useMutation › should optimistically go to paused state if offline | ported | `useMutation.parity.test.tsx` › should optimistically go to paused state if offline |
| useMutation › should be able to retry a mutation when online | ported | `useMutation.parity.test.tsx` › should be able to retry a mutation when online |
| useMutation › should not change state if unmounted | ported | `useMutation.parity.test.tsx` › should not change state if unmounted |
| useMutation › should be able to throw an error when throwOnError is set to true | ported | `useMutation.parity-b.test.tsx` › should be able to throw an error when throwOnError is set to true |
| useMutation › should be able to throw an error when throwOnError is a function that returns true | ported | `useMutation.parity-b.test.tsx` › should be able to throw an error when throwOnError is a function that returns true |
| useMutation › should not throw an error when throwOnError is set to false | ported | `useMutation.parity-b.test.tsx` › should not throw an error when throwOnError is set to false |
| useMutation › should not throw an error when throwOnError is a function that returns false | ported | `useMutation.parity-b.test.tsx` › should not throw an error when throwOnError is a function that returns false |
| useMutation › should not throw an error when throwOnError is not set | ported | `useMutation.parity-b.test.tsx` › should not throw an error when throwOnError is not set |
| useMutation › should pass meta to mutation on success | ported | `useMutation.parity-b.test.tsx` › should pass meta to mutation on success |
| useMutation › should pass meta to mutation on error | ported | `useMutation.parity-b.test.tsx` › should pass meta to mutation on error |
| useMutation › should call cache callbacks when unmounted | ported | `useMutation.parity-b.test.tsx` › should call cache callbacks when unmounted |
| useMutation › should call mutate callbacks only for the last observer | ported | `useMutation.parity-b.test.tsx` › should call mutate callbacks only for the last observer |
| useMutation › should go to error state if onSuccess callback errors | ported | `useMutation.parity-b.test.tsx` › should go to error state if onSuccess callback errors |
| useMutation › should go to error state if onError callback errors | ported | `useMutation.parity-b.test.tsx` › should go to error state if onError callback errors |
| useMutation › should go to error state if onSettled callback errors | ported | `useMutation.parity-b.test.tsx` › should go to error state if onSettled callback errors |
| useMutation › should use provided custom queryClient | ported | `useMutation.parity-b.test.tsx` › should use provided custom queryClient |
| useMutation › should be able to chain mutateAsync calls sequentially | ported | `useMutation.parity-b.test.tsx` › should be able to chain mutateAsync calls sequentially |
| useMutation › should handle error in chained mutateAsync calls | ported | `useMutation.parity-b.test.tsx` › should handle error in chained mutateAsync calls |
| useMutation › should set success message from mutate callbacks when mutation succeeds | ported | `useMutation.parity-b.test.tsx` › should set success message from mutate callbacks when mutation succeeds |
| useMutation › should set error message from mutate callbacks when mutation fails | ported | `useMutation.parity-b.test.tsx` › should set error message from mutate callbacks when mutation fails |
| useMutation › should handle conditional error with retry using mutate | ported | `useMutation.parity-b.test.tsx` › should handle conditional error with retry using mutate |
| useMutation › should support optimistic update on success | ported | `useMutation.parity-b.test.tsx` › should support optimistic update on success |
| useMutation › should support optimistic update and rollback on error | ported | `useMutation.parity-b.test.tsx` › should support optimistic update and rollback on error |
| useMutation › should update the cache in onMutate and roll back via onMutateResult in onError | ported | `useMutation.parity-b.test.tsx` › should update the cache in onMutate and roll back via onMutateResult in onError |
| useMutation › should keep the optimistic update in place when the mutation succeeds | ported | `useMutation.parity-b.test.tsx` › should keep the optimistic update in place when the mutation succeeds |
| useMutation › should be able to run multiple mutateAsync calls in parallel with Promise.all | ported | `useMutation.parity-b.test.tsx` › should be able to run multiple mutateAsync calls in parallel with Promise.all |
| useMutation › should handle Promise.all rejection when one parallel mutateAsync call fails | ported | `useMutation.parity-b.test.tsx` › should handle Promise.all rejection when one parallel mutateAsync call fails |
| useMutation › should handle partial failure in parallel mutateAsync calls with Promise.allSettled | ported | `useMutation.parity-b.test.tsx` › should handle partial failure in parallel mutateAsync calls with Promise.allSettled |
| useMutation › should pass a non-undefined onMutateResult alongside context to onSuccess | ported | `useMutation.parity-b.test.tsx` › should pass a non-undefined onMutateResult alongside context to onSuccess |
| useMutation › should give mutationFn the same QueryClient instance via context | ported | `useMutation.parity-b.test.tsx` › should give mutationFn the same QueryClient instance via context |
| useMutation › should include mutationKey in the context passed to hook-level callbacks | ported | `useMutation.parity-b.test.tsx` › should include mutationKey in the context passed to hook-level callbacks |
| useMutation › should let onSuccess invalidate queries via context.client without a useQueryClient() closure | ported | `useMutation.parity-b.test.tsx` › should let onSuccess invalidate queries via context.client without a useQueryClient() closure |

## react-query › useMutationState.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useIsMutating › should return the number of fetching mutations | ported | `useMutationState.parity.test.tsx` › useIsMutating › should return the number of fetching mutations |
| useIsMutating › should update when the query client is cleared | ported | `useMutationState.parity.test.tsx` › useIsMutating › should update when the query client is cleared |
| useIsMutating › should filter correctly by mutationKey | ported | `useMutationState.parity.test.tsx` › useIsMutating › should filter correctly by mutationKey |
| useIsMutating › should filter correctly by predicate | ported | `useMutationState.parity.test.tsx` › useIsMutating › should filter correctly by predicate |
| useIsMutating › should use provided custom queryClient | ported | `useMutationState.parity.test.tsx` › useIsMutating › should use provided custom queryClient |
| useIsMutating › should update when filters change without a cache update | ported | `useMutationState.parity.test.tsx` › useIsMutating › should update when filters change without a cache update |
| useMutationState › should update when filters change without a cache update | ported | `useMutationState.parity.test.tsx` › useMutationState › should update when filters change without a cache update |
| useMutationState › should update when select changes without a cache update | ported | `useMutationState.parity.test.tsx` › useMutationState › should update when select changes without a cache update |
| useMutationState › should recompute %s results on rerender with stable filters and select | ported | `useMutationState.parity.test.tsx` › useMutationState › should recompute object results on rerender with stable filters and select<br>`useMutationState.parity.test.tsx` › useMutationState › should recompute Date results on rerender with stable filters and select |
| useMutationState › should render selector results that cannot be structurally shared | ported | `useMutationState.parity.test.tsx` › useMutationState › should render selector results that cannot be structurally shared |
| useMutationState › should update Date selector results when mutation state changes | ported | `useMutationState.parity.test.tsx` › useMutationState › should update Date selector results when mutation state changes |
| useMutationState › should update when only the mutation state changes | ported | `useMutationState.parity.test.tsx` › useMutationState › should update when only the mutation state changes |
| useMutationState › should preserve the result reference with %s inputs | ported | `useMutationState.parity.test.tsx` › useMutationState › should preserve the result reference with stable inputs<br>`useMutationState.parity.test.tsx` › useMutationState › should preserve the result reference with inline inputs |
| useMutationState › should read from a changed custom queryClient | NSH differs | `useMutationState.parity.test.tsx` › useMutationState › should read from a changed custom queryClient |
| useMutationState › should remove successful mutations when the query client is cleared | ported | `useMutationState.parity.test.tsx` › useMutationState › should remove successful mutations when the query client is cleared |
| useMutationState › should return variables after calling mutate | ported | `useMutationState.parity.test.tsx` › useMutationState › should return variables after calling mutate |

## react-query › usePrefetchInfiniteQuery.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| usePrefetchInfiniteQuery › should prefetch an infinite query if query state does not exist | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |
| usePrefetchInfiniteQuery › should not display fallback if the query cache is already populated | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |
| usePrefetchInfiniteQuery › should not create an endless loop when using inside a suspense boundary | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |

## react-query › usePrefetchQuery.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| usePrefetchQuery › should prefetch query if query state does not exist | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |
| usePrefetchQuery › should not prefetch query if query state exists | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |
| usePrefetchQuery › should let errors fall through and not refetch failed queries | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |
| usePrefetchQuery › should not create an endless loop when using inside a suspense boundary | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |
| usePrefetchQuery › should be able to recover from errors and try fetching again | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |
| usePrefetchQuery › should not create a suspense waterfall if prefetch is fired | not applicable | react-query's prefetch-in-render hook: not part of nsh-query's API (solid-query has none either) |

## react-query › useQueries.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useQueries › should settle after fetched data reaches an inline selector (throws: %s) | ported | `useQueries.parity.test.tsx` › should settle after fetched data reaches an inline selector (throws: false)<br>`useQueries.parity.test.tsx` › should settle after fetched data reaches an inline selector (throws: true) |
| useQueries › should return the correct states | ported | `useQueries.parity.test.tsx` › should return the correct states |
| useQueries › should not optimistically show fetching when unsubscribed | not applicable | nsh-query's useQueries has no `subscribed` option. |
| useQueries › should track results | ported | `useQueries.parity.test.tsx` › should track results |
| useQueries › should throw error if in one of queries' queryFn throws and throwOnError is in use | ported | `useQueries.parity.test.tsx` › should throw error if in one of queries' queryFn throws and throwOnError is in use |
| useQueries › should throw error if in one of queries' queryFn throws and throwOnError function resolves to true | ported | `useQueries.parity.test.tsx` › should throw error if in one of queries' queryFn throws and throwOnError function resolves to true |
| useQueries › should throw error if in one of queries' queryFn rejects with a falsy error and throwOnError is in use | ported | `useQueries.parity.test.tsx` › should throw error if in one of queries' queryFn rejects with a falsy error and throwOnError is in use |
| useQueries › should use provided custom queryClient | ported | `useQueries.parity.test.tsx` › should use provided custom queryClient |
| useQueries › should combine queries | ported | `useQueries.parity.test.tsx` › should combine queries |
| useQueries › should not return new instances when called without queries | ported | `useQueries.parity.test.tsx` › should not return new instances when called without queries |
| useQueries › should not have infinite render loops with empty queries (#6645) | ported | `useQueries.parity.test.tsx` › should not have infinite render loops with empty queries (#6645) |
| useQueries › should only call combine with query results | ported | `useQueries.parity.test.tsx` › should only call combine with query results |
| useQueries › should track property access through combine function | ported | `useQueries.parity.test.tsx` › should track property access through combine function |
| useQueries › should synchronously track properties of all observer even if a property (isLoading) is only accessed on one observer (#7000) | ported | `useQueries.parity.test.tsx` › should synchronously track properties of all observer even if a property (isLoading) is only accessed on one observer (#7000) |
| useQueries › should not have stale closures with combine (#6648) | ported | `useQueries.parity.test.tsx` › should not have stale closures with combine (#6648) |
| useQueries › should optimize combine if it is a stable reference | ported | `useQueries.parity.test.tsx` › should optimize combine if it is a stable reference |
| useQueries › should re-run combine if the functional reference changes | ported | `useQueries.parity.test.tsx` › should re-run combine if the functional reference changes |
| useQueries › should not re-render if combine returns a stable reference | NSH differs | `useQueries.parity.test.tsx` › should not re-render if combine returns a stable reference |
| useQueries › should re-render once combine returns a different reference | NSH differs | `useQueries.parity.test.tsx` › should re-render once combine returns a different reference |
| useQueries › should track properties correctly with combine | NSH differs | `useQueries.parity.test.tsx` › should track properties correctly with combine |
| useQueries › should not re-run stable combine on unrelated re-render | ported | `useQueries.parity.test.tsx` › should not re-run stable combine on unrelated re-render |
| useQueries › should not cause infinite re-renders when removing last query | ported | `useQueries.parity.test.tsx` › should not cause infinite re-renders when removing last query |
| useQueries › should return correct results when queries count changes with stable combine reference | ported | `useQueries.parity.test.tsx` › should return correct results when queries count changes with stable combine reference |
| useQueries › should not fetch for the duration of the restoring period when isRestoring is true | ported | `useQueries.parity.test.tsx` › should not fetch for the duration of the restoring period when isRestoring is true |
| useQueries › should not fetch queries with different durations for the duration of the restoring period when isRestoring is true | ported | `useQueries.parity.test.tsx` › should not fetch queries with different durations for the duration of the restoring period when isRestoring is true |
| useQueries › should not fetch the previous keys when a hidden Activity with changed keys is revealed | not applicable | React-only: React.Activity (hidden/visible subtrees) has no NSH counterpart. |

## react-query › useQuery.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useQuery › should stay idle after a cancelled retry delay (StrictMode: %s) | ported | `useQuery.parity-react.test.tsx` › should stay idle after a cancelled retry delay (StrictMode: %s) |
| useQuery › should allow to set default data value | ported | `useQuery.parity-solid-1.test.tsx` › should allow to set default data value |
| useQuery › should return the correct states for a successful query | ported | `useQuery.parity-solid-1.test.tsx` › should return the correct states for a successful query |
| useQuery › should return the correct states for an unsuccessful query | ported | `useQuery.parity-solid-1.test.tsx` › should return the correct states for an unsuccessful query |
| useQuery › should set isFetchedAfterMount to true after a query has been fetched | ported | `useQuery.parity-solid-1.test.tsx` › should set isFetchedAfterMount to true after a query has been fetched |
| useQuery › should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already | ported | `useQuery.parity-solid-1.test.tsx` › should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already |
| useQuery › should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already | ported | `useQuery.parity-solid-1.test.tsx` › should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already |
| useQuery › should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet | ported | `useQuery.parity-solid-1.test.tsx` › should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet |
| useQuery › should be able to watch a query without providing a query function | ported | `useQuery.parity-solid-1.test.tsx` › should be able to watch a query without providing a query function |
| useQuery › should pick up a query when re-mounting with gcTime 0 | ported | `useQuery.parity-solid-1.test.tsx` › should pick up a query when re-mounting with gcTime 0 |
| useQuery › should not get into an infinite loop when removing a query with gcTime 0 and rerendering | ported | `useQuery.parity-react.test.tsx` › should not get into an infinite loop when removing a query with gcTime 0 and rerendering |
| useQuery › should fetch when refetchOnMount is false and nothing has been fetched yet | ported | `useQuery.parity-solid-1.test.tsx` › should fetch when refetchOnMount is false and nothing has been fetched yet |
| useQuery › should not fetch when refetchOnMount is false and data has been fetched already | ported | `useQuery.parity-solid-1.test.tsx` › should not fetch when refetchOnMount is false and data has been fetched already |
| useQuery › should be able to select a part of the data with select | ported | `useQuery.parity-solid-1.test.tsx` › should be able to select a part of the data with select |
| useQuery › should be able to select a part of the data with select in object syntax | ported | `useQuery.parity-react.test.tsx` › should be able to select a part of the data with select in object syntax |
| useQuery › should throw an error when a selector throws | ported | `useQuery.parity-solid-1.test.tsx` › should throw an error when a selector throws |
| useQuery › should not re-run a stable select when it re-renders if selector throws an error | ported | `useQuery.parity-react.test.tsx` › should not re-run a stable select when it re-renders if selector throws an error |
| useQuery › should track properties and only re-render when a tracked property changes | ported | `useQuery.parity-solid-1.test.tsx` › should track properties and only re-render when a tracked property changes |
| useQuery › should always re-render if we are tracking props but not using any | ported | `useQuery.parity-solid-1.test.tsx` › should always re-render if we are tracking props but not using any |
| useQuery › should be able to remove a query | ported | `useQuery.parity-react.test.tsx` › should be able to remove a query |
| useQuery › should create a new query when refetching a removed query | ported | `useQuery.parity-react.test.tsx` › should create a new query when refetching a removed query |
| useQuery › should share equal data structures between query results | ported | `useQuery.parity-solid-1.test.tsx` › should share equal data structures between query results |
| useQuery › should use query function from hook when the existing query does not have a query function | ported | `useQuery.parity-solid-1.test.tsx` › should use query function from hook when the existing query does not have a query function |
| useQuery › should update query stale state and refetch when invalidated with invalidateQueries | ported | `useQuery.parity-solid-1.test.tsx` › should update query stale state and refetch when invalidated with invalidateQueries |
| useQuery › should not update disabled query when refetching with refetchQueries | ported | `useQuery.parity-react.test.tsx` › should not update disabled query when refetching with refetchQueries |
| useQuery › should not refetch disabled query when invalidated with invalidateQueries | ported | `useQuery.parity-solid-1.test.tsx` › should not refetch disabled query when invalidated with invalidateQueries |
| useQuery › should not fetch when switching to a disabled query | ported | `useQuery.parity-solid-1.test.tsx` › should not fetch when switching to a disabled query |
| useQuery › should keep the previous data when placeholderData is set | ported | `useQuery.parity-solid-1.test.tsx` › should keep the previous data when placeholderData is set |
| useQuery › should keep the previous data when placeholderData is set and select fn transform is used | ported | `useQuery.parity-react.test.tsx` › should keep the previous data when placeholderData is set and select fn transform is used |
| useQuery › should keep the previous queryKey (from prevQuery) between multiple pending queries when placeholderData is set and select fn transform is used | ported | `useQuery.parity-react.test.tsx` › should keep the previous queryKey (from prevQuery) between multiple pending queries when placeholderData is set and select fn transform is used |
| useQuery › should show placeholderData between multiple pending queries when select fn transform is used | ported | `useQuery.parity-react.test.tsx` › should show placeholderData between multiple pending queries when select fn transform is used |
| useQuery › should transition to error state when placeholderData is set | ported | `useQuery.parity-react.test.tsx` › should transition to error state when placeholderData is set |
| useQuery › should not show initial data from next query if placeholderData is set | ported | `useQuery.parity-solid-1.test.tsx` › should not show initial data from next query if placeholderData is set |
| useQuery › should keep the previous data on disabled query when placeholderData is set | ported | `useQuery.parity-react.test.tsx` › should keep the previous data on disabled query when placeholderData is set |
| useQuery › should keep the previous data on disabled query when placeholderData is set and switching query key multiple times | ported | `useQuery.parity-solid-1.test.tsx` › should keep the previous data on disabled query when placeholderData is set and switching query key multiple times |
| useQuery › should use the correct query function when components use different configurations | ported | `useQuery.parity-solid-1.test.tsx` › should use the correct query function when components use different configurations |
| useQuery › should be able to set different stale times for a query | ported | `useQuery.parity-solid-1.test.tsx` › should be able to set different stale times for a query |
| useQuery › should re-render when a query becomes stale | ported | `useQuery.parity-solid-1.test.tsx` › should re-render when a query becomes stale |
| useQuery › should re-render disabled observers when other observers trigger a query (#8741) | ported | `useQuery.parity-react.test.tsx` › should re-render disabled observers when other observers trigger a query (#8741) |
| useQuery › notifyOnChangeProps › should not re-render when it should only re-render only data change and the selected data did not change | ported | `useQuery.parity-solid-1.test.tsx` › should not re-render when it should only re-render only data change and the selected data did not change |
| useQuery › notifyOnChangeProps › should not re-render when it should only re-render on data changes and the data did not change | ported | `useQuery.parity-solid-1.test.tsx` › should not re-render when it should only re-render on data changes and the data did not change |
| useQuery › notifyOnChangeProps › function › should not re-render when it should only re-render on data changes and the data did not change | ported | `useQuery.parity-solid-1.test.tsx` › should not re-render when it should only re-render on data changes and the data did not change |
| useQuery › notifyOnChangeProps › function › should not re-render when change props are not actively being tracked | ported | `useQuery.parity-react.test.tsx` › should not re-render when change props are not actively being tracked |
| useQuery › should not override initial data in dependent queries | ported | `useQuery.parity-solid-1b.test.tsx` › should not override initial data in dependent queries |
| useQuery › should update query options | ported | `useQuery.parity-solid-1b.test.tsx` › should update query options |
| useQuery › should batch re-renders | ported | `useQuery.parity-solid-1b.test.tsx` › should batch re-renders |
| useQuery › should render latest data even if react has discarded certain renders | ported | `useQuery.parity-solid-1b.test.tsx` › should render latest data even if react has discarded certain renders |
| useQuery › should start with status pending, fetchStatus idle if enabled is false | ported | `useQuery.parity-solid-1b.test.tsx` › should start with status pending, fetchStatus idle if enabled is false |
| useQuery › should be in "pending" state by default | ported | `useQuery.parity-solid-1b.test.tsx` › should be in "pending" state by default |
| useQuery › should not refetch query on focus when `enabled` is set to `false` | ported | `useQuery.parity-solid-1b.test.tsx` › should not refetch query on focus when `enabled` is set to `false` |
| useQuery › should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false` | ported | `useQuery.parity-solid-1b.test.tsx` › should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false` |
| useQuery › should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false` | ported | `useQuery.parity-solid-1b.test.tsx` › should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false` |
| useQuery › should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true` | ported | `useQuery.parity-solid-1b.test.tsx` › should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true` |
| useQuery › should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always` | ported | `useQuery.parity-solid-1b.test.tsx` › should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always` |
| useQuery › should calculate focus behavior for `refetchOnWindowFocus` depending on function | ported | `useQuery.parity-solid-1b.test.tsx` › should calculate focus behavior for refetchOnWindowFocus depending on function |
| useQuery › should refetch fresh query when refetchOnMount is set to always | ported | `useQuery.parity-solid-1b.test.tsx` › should refetch fresh query when refetchOnMount is set to always |
| useQuery › should refetch stale query when refetchOnMount is set to true | ported | `useQuery.parity-solid-1b.test.tsx` › should refetch stale query when refetchOnMount is set to true |
| useQuery › should set status to error if queryFn throws | ported | `useQuery.parity-solid-1b.test.tsx` › should set status to error if queryFn throws |
| useQuery › should throw error if queryFn throws and throwOnError is in use | ported | `useQuery.parity-solid-1b.test.tsx` › should throw error if queryFn throws and throwOnError is in use |
| useQuery › should throw error if queryFn rejects with a falsy error and throwOnError is in use | NSH differs | `useQuery.parity-react.test.tsx` › should throw error if queryFn rejects with a falsy error and throwOnError is in use |
| useQuery › should update with data if we observe no properties and throwOnError | ported | `useQuery.parity-solid-1b.test.tsx` › should update with data if we observe no properties and throwOnError |
| useQuery › should set status to error instead of throwing when error should not be thrown | ported | `useQuery.parity-solid-1b.test.tsx` › should set status to error instead of throwing when error should not be thrown |
| useQuery › should throw error instead of setting status when error should be thrown | ported | `useQuery.parity-solid-1b.test.tsx` › should throw error instead of setting status when error should be thrown |
| useQuery › should continue retries when observers unmount and remount while waiting for a retry (#3031) | ported | `useQuery.parity-solid-1b.test.tsx` › should continue retries when observers unmount and remount while waiting for a retry (#3031) |
| useQuery › should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031) | ported | `useQuery.parity-solid-1b.test.tsx` › should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031) |
| useQuery › should always fetch if refetchOnMount is set to always | ported | `useQuery.parity-solid-1b.test.tsx` › should always fetch if refetchOnMount is set to always |
| useQuery › should fetch if initial data is set | ported | `useQuery.parity-solid-1b.test.tsx` › should fetch if initial data is set |
| useQuery › should not fetch if initial data is set with a stale time | ported | `useQuery.parity-solid-1b.test.tsx` › should not fetch if initial data is set with a stale time |
| useQuery › should fetch if initial data updated at is older than stale time | ported | `useQuery.parity-solid-1b.test.tsx` › should fetch if initial data updated at is older than stale time |
| useQuery › should fetch if "initial data updated at" is exactly 0 | ported | `useQuery.parity-solid-1b.test.tsx` › should fetch if "initial data updated at" is exactly 0 |
| useQuery › should keep initial data when the query key changes | ported | `useQuery.parity-solid-1b.test.tsx` › should keep initial data when the query key changes |
| useQuery › should keep initialData visible alongside the error when a refetch fails | ported | `useQuery.parity-solid-1b.test.tsx` › should keep initialData visible alongside the error when a refetch fails |
| useQuery › should retry specified number of times | ported | `useQuery.parity-solid-1b.test.tsx` › should retry specified number of times |
| useQuery › should not retry if retry function `false` | ported | `useQuery.parity-solid-2.test.tsx` › should not retry if retry function `false` |
| useQuery › should extract retryDelay from error | ported | `useQuery.parity-solid-2.test.tsx` › should extract retryDelay from error |
| useQuery › should continue retry after focus regain | ported | `useQuery.parity-solid-2.test.tsx` › should continue retry after focus regain |
| useQuery › should fetch on mount when a query was already created with setQueryData | ported | `useQuery.parity-solid-2.test.tsx` › should fetch on mount when a query was already created with setQueryData |
| useQuery › should refetch after focus regain | ported | `useQuery.parity-solid-2.test.tsx` › should refetch after focus regain |
| useQuery › should refetch if stale after a prefetch | ported | `useQuery.parity-solid-2.test.tsx` › should refetch if stale after a prefetch |
| useQuery › should not refetch if not stale after a prefetch | ported | `useQuery.parity-solid-2.test.tsx` › should not refetch if not stale after a prefetch |
| useQuery › should reset failureCount on successful fetch | ported | `useQuery.parity-react.test.tsx` › should reset failureCount on successful fetch |
| useQuery › should use prefetched data for dependent query | ported | `useQuery.parity-solid-2.test.tsx` › should use prefetched data for dependent query |
| useQuery › should support dependent queries via the enable config option | ported | `useQuery.parity-solid-2.test.tsx` › should support dependent queries via the enable config option |
| useQuery › should mark query as fetching, when using initialData | ported | `useQuery.parity-solid-2.test.tsx` › should mark query as fetching, when using initialData |
| useQuery › should initialize state properly, when initialData is falsy | ported | `useQuery.parity-solid-2.test.tsx` › should initialize state properly, when initialData is falsy |
| useQuery › should show the correct data when switching keys with initialData, placeholderData & staleTime | ported | `useQuery.parity-react.test.tsx` › should show the correct data when switching keys with initialData, placeholderData & staleTime |
| useQuery › should persist data when enabled is changed to false | ported | `useQuery.parity-solid-2.test.tsx` › should persist data when enabled is changed to false |
| useQuery › should support enabled:false in query object syntax | ported | `useQuery.parity-solid-2.test.tsx` › should support enabled:false in query object syntax |
| useQuery › should init to status:pending, fetchStatus:idle when enabled is false | ported | `useQuery.parity-solid-2.test.tsx` › should init to status:pending, fetchStatus:idle when enabled is false |
| useQuery › should not schedule garbage collection, if gcTimeout is set to `Infinity` | ported | `useQuery.parity-solid-2.test.tsx` › should not schedule garbage collection, if gcTimeout is set to `Infinity` |
| useQuery › should schedule garbage collection, if gcTimeout is not set to infinity | ported | `useQuery.parity-solid-2.test.tsx` › should schedule garbage collection, if gcTimeout is not set to `Infinity` |
| useQuery › should not cause memo churn when data does not change | NSH differs | `useQuery.parity-solid-2.test.tsx` › should not cause memo churn when data does not change |
| useQuery › should update data upon interval changes | ported | `useQuery.parity-solid-2.test.tsx` › should update data upon interval changes |
| useQuery › should refetch in an interval depending on function result | ported | `useQuery.parity-solid-2.test.tsx` › should refetch in an interval depending on function result |
| useQuery › should not interval fetch with a refetchInterval of 0 | ported | `useQuery.parity-solid-2.test.tsx` › should not interval fetch with a refetchInterval of 0 |
| useQuery › should accept an empty string as query key | ported | `useQuery.parity-solid-2.test.tsx` › should accept an empty string as query key |
| useQuery › should accept an object as query key | ported | `useQuery.parity-solid-2.test.tsx` › should accept an object as query key |
| useQuery › should refetch if any query instance becomes enabled | ported | `useQuery.parity-solid-2.test.tsx` › should refetch if any query instance becomes enabled |
| useQuery › should use placeholder data while the query loads | ported | `useQuery.parity-solid-2.test.tsx` › should use placeholder data while the query loads |
| useQuery › should use placeholder data even for disabled queries | ported | `useQuery.parity-solid-2.test.tsx` › should use placeholder data even for disabled queries |
| useQuery › should run placeholder data through select | ported | `useQuery.parity-solid-2.test.tsx` › should run placeholder data through select |
| useQuery › should run placeholder data function result through select | ported | `useQuery.parity-solid-2.test.tsx` › should run placeholder data function result through select |
| useQuery › should only run select when dependencies change if memoized | ported | `useQuery.parity-react-b.test.tsx` › should only run select when dependencies change if memoized |
| useQuery › should always return the correct state from select | ported | `useQuery.parity-solid-2.test.tsx` › should always return the correct state from select |
| useQuery › should structurally share data in select | ported | `useQuery.parity-solid-2.test.tsx` › should structurally share data in select |
| useQuery › should cancel the query function when there are no more subscriptions | ported | `useQuery.parity-solid-2b.test.tsx` › should cancel the query function when there are no more subscriptions |
| useQuery › should cancel the query if the signal was consumed and there are no more subscriptions | ported | `useQuery.parity-solid-2b.test.tsx` › should cancel the query if the signal was consumed and there are no more subscriptions |
| useQuery › should refetch when quickly switching to a failed query | ported | `useQuery.parity-solid-2b.test.tsx` › should refetch when quickly switching to a failed query |
| useQuery › should update query state and refetch when reset with resetQueries | ported | `useQuery.parity-solid-2b.test.tsx` › should update query state and refetch when reset with resetQueries |
| useQuery › should update query state and not refetch when resetting a disabled query with resetQueries | ported | `useQuery.parity-solid-2b.test.tsx` › should update query state and not refetch when resetting a disabled query with resetQueries |
| useQuery › should only call the query hash function once each render | ported | `useQuery.parity-react-b.test.tsx` › should only call the query hash function once each render |
| useQuery › should hash query keys that contain bigints given a supported query hash function | ported | `useQuery.parity-react-b.test.tsx` › should hash query keys that contain bigints given a supported query hash function |
| useQuery › should refetch when changed enabled to true in error state | ported | `useQuery.parity-solid-2b.test.tsx` › should refetch when changed enabled to true in error state |
| useQuery › should refetch when query key changed when previous status is error | ported | `useQuery.parity-solid-2b.test.tsx` › should refetch when query key changed when previous status is error |
| useQuery › should refetch when query key changed when switching between erroneous queries | ported | `useQuery.parity-solid-2b.test.tsx` › should refetch when query key changed when switching between erroneous queries |
| useQuery › should have no error in pending state when refetching after error occurred | ported | `useQuery.parity-solid-2b.test.tsx` › should have no error in pending state when refetching after error occurred |
| useQuery › networkMode online › should not start fetching online queries if you are offline | ported | `useQuery.parity-solid-2b.test.tsx` › should not start fetching online queries if you are offline |
| useQuery › networkMode online › should not refetch online queries if you are offline | ported | `useQuery.parity-solid-2b.test.tsx` › should not refetch online queries if you are offline |
| useQuery › networkMode online › should not refetch online queries if you are offline and refocus | ported | `useQuery.parity-solid-2b.test.tsx` › should not refetch online queries if you are offline and refocus |
| useQuery › networkMode online › should not refetch online queries while already paused | ported | `useQuery.parity-solid-2b.test.tsx` › should not refetch online queries while already paused |
| useQuery › networkMode online › should not refetch online queries while already paused if data is in the cache | ported | `useQuery.parity-solid-2b.test.tsx` › should not refetch online queries while already paused if data is in the cache |
| useQuery › networkMode online › should not get online queries stuck in fetching state when pausing multiple times | ported | `useQuery.parity-solid-2b.test.tsx` › should not get online queries stuck in fetching state when pausing multiple times |
| useQuery › networkMode online › should pause retries of online queries if you are offline | ported | `useQuery.parity-solid-2b.test.tsx` › should pause retries of online queries if you are offline |
| useQuery › networkMode online › should not fetch online queries if paused initial load and we go online after unmount | ported | `useQuery.parity-solid-2b.test.tsx` › should not fetch online queries if paused initial load and we go online after unmount |
| useQuery › networkMode online › should re-fetch online queries if paused and we go online even if already unmounted (because not cancelled) | ported | `useQuery.parity-solid-2b.test.tsx` › should re-fetch online queries if paused and we go online even if already unmounted (because not cancelled) |
| useQuery › networkMode online › should not fetch online queries if paused and we go online when cancelled and no refetchOnReconnect | ported | `useQuery.parity-solid-2b.test.tsx` › should not fetch online queries if paused and we go online when cancelled and no refetchOnReconnect |
| useQuery › networkMode online › should fetch online queries if paused and we go online even if already unmounted when refetch was not cancelled | ported | `useQuery.parity-solid-2b.test.tsx` › should fetch online queries if paused and we go online even if already unmounted when refetch was not cancelled |
| useQuery › networkMode always › should start fetching always queries even if you are offline | ported | `useQuery.parity-solid-2b.test.tsx` › should start fetching always queries even if you are offline |
| useQuery › networkMode always › should not pause retries of always queries | ported | `useQuery.parity-solid-2b.test.tsx` › should not pause retries of always queries |
| useQuery › networkMode offlineFirst › should start fetching offlineFirst queries if you are offline, but pause retries | ported | `useQuery.parity-solid-2b.test.tsx` › should start fetching offlineFirst queries if you are offline, but pause retries |
| useQuery › subscribed › should be able to toggle subscribed | not applicable | `subscribed` is a react-query-only option; nsh-query (like solid-query) has no `subscribed` option. |
| useQuery › subscribed › should not optimistically show fetching when unsubscribed | not applicable | `subscribed` is a react-query-only option; nsh-query (like solid-query) has no `subscribed` option. |
| useQuery › subscribed › should not be attached to the query when subscribed is false | not applicable | `subscribed` is a react-query-only option; nsh-query (like solid-query) has no `subscribed` option. |
| useQuery › subscribed › should not re-render when data is added to the cache when subscribed is false | not applicable | `subscribed` is a react-query-only option; nsh-query (like solid-query) has no `subscribed` option. |
| useQuery › should have status=error on mount when a query has failed | ported | `useQuery.parity-solid-2b.test.tsx` › should have status=error on mount when a query has failed |
| useQuery › should respect updatedAt in setQueryData | ported | `useQuery.parity-solid-2b.test.tsx` › should respect updatedAt in setQueryData |
| useQuery › should increase errorUpdateCount on each fetch failure | ported | `useQuery.parity-solid-2b.test.tsx` › should increase errorUpdateCount on each fetch failure |
| useQuery › should use provided custom queryClient | ported | `useQuery.parity-solid-2b.test.tsx` › should use provided custom queryClient |
| useQuery › should be notified of updates between create and subscribe | ported | `useQuery.parity-react-b.test.tsx` › should be notified of updates between create and subscribe |
| useQuery › should reuse same data object reference when queryKey changes back to some cached data | ported | `useQuery.parity-react-b.test.tsx` › should reuse same data object reference when queryKey changes back to some cached data |
| useQuery › should reuse same data object reference when queryKey changes and placeholderData is present | ported | `useQuery.parity-react-b.test.tsx` › should reuse same data object reference when queryKey changes and placeholderData is present |
| useQuery › should not cause an infinite render loop when using unstable callback ref | ported | `useQuery.parity-react-b.test.tsx` › should not cause an infinite render loop when using unstable callback ref |
| useQuery › should keep the previous data when placeholderData is set and cache is used | ported | `useQuery.parity-react-b.test.tsx` › should keep the previous data when placeholderData is set and cache is used |
| useQuery › should throw in case of bad arguments to enhance DevX | ported | `useQuery.parity-react-b.test.tsx` › should throw in case of bad arguments to enhance DevX |
| useQuery › should respect skipToken and refetch when skipToken is taken away | ported | `useQuery.parity-react-b.test.tsx` › should respect skipToken and refetch when skipToken is taken away |
| useQuery › should allow enabled: true and queryFn: skipToken | ported | `useQuery.parity-react-b.test.tsx` › should allow enabled: true and queryFn: skipToken |
| useQuery › should return correct optimistic result when fetching after error | ported | `useQuery.parity-react-b.test.tsx` › should return correct optimistic result when fetching after error |
| useQuery › should pick up an initialPromise | not applicable | Hydration: an initialPromise comes from dehydrate/hydrate of a server client (SSR). |
| useQuery › should retry failed initialPromise on the client | not applicable | Hydration: retries a promise dehydrated on a server client (SSR); also asserts console.error output. |
| useQuery › should console.error when there is no queryFn | not applicable | Its only assertions are on console.error output. |
| useQuery › should retry on mount when throwOnError returns false | ported | `useQuery.parity-react-b.test.tsx` › should retry on mount when throwOnError returns false |
| useQuery › should retry on mount when throwOnError returns false for a falsy error | ported | `useQuery.parity-react-b.test.tsx` › should retry on mount when throwOnError returns false for a falsy error |
| useQuery › should not retry on mount when throwOnError function returns true | NSH differs | `useQuery.parity-react-b.test.tsx` › should not retry on mount when throwOnError function returns true |
| useQuery › should handle throwOnError function based on actual error state | ported | `useQuery.parity-react-b.test.tsx` › should handle throwOnError function based on actual error state |
| useQuery › should pass the query to retryOnMount callback | ported | `useQuery.parity-react-b.test.tsx` › should pass the query to retryOnMount callback |
| useQuery › should not call retryOnMount callback when the query has data | ported | `useQuery.parity-react-b.test.tsx` › should not call retryOnMount callback when the query has data |
| useQuery › should not fetch for the duration of the restoring period when isRestoring is true | ported | `useQuery.parity-react-b.test.tsx` › should not fetch for the duration of the restoring period when isRestoring is true |
| useQuery › should not fetch the previous key when a hidden Activity with a changed key is revealed | not applicable | React.Activity is React-only machinery. |
| useQuery › should not loop when a query with select and keepPreviousData is disabled | ported | `useQuery.parity-react-b.test.tsx` › should not loop when a query with select and keepPreviousData is disabled |
| useQuery › should settle as placeholder data when select maps keepPreviousData to undefined | ported | `useQuery.parity-react-b.test.tsx` › should settle as placeholder data when select maps keepPreviousData to undefined |

## react-query › useSuspenseInfiniteQuery.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useSuspenseInfiniteQuery › should return the correct states for a successful infinite query | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseInfiniteQuery › should log an error when skipToken is passed as queryFn | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseInfiniteQuery › should log an error when skipToken is used in development environment | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseInfiniteQuery › should not log an error when skipToken is used in production environment | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseInfiniteQuery › should still suspense if queryClient has placeholderData config | not applicable | Suspense hook: nsh-query has no Suspense |

## react-query › useSuspenseQueries.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useSuspenseQueries › should suspend on mount | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should resolve queries | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not suspend on mount if query has been already fetched | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not break suspense when queries change without resolving | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should suspend only once per queries change | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should only call combine after resolving | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not call combine while reset queries are pending again | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should handle duplicate query keys without infinite loops | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should suspend all queries in parallel | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not unmount before all promises fetched | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should suspend on offline when query changes, and data should not be undefined | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should throw error when a queryFn rejects with a falsy error | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should throw error when queryKey changes and new query fails | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should keep previous data when wrapped in a transition | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not request old data inside transitions (issue #6486) | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should still suspense if queryClient has placeholderData config | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should show error boundary even with gcTime:0 (#7853) | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › gc (with fake timers) › should gc when unmounted while fetching with low gcTime (#8159) | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should log an error when skipToken is passed as queryFn | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should log an error when skipToken is used in development environment | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not log an error when skipToken is used in production environment | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should only suspend queries that are pending when the slower query already has data | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should only suspend queries that are pending when the faster query already has data | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not suspend and not refetch when all queries have fresh cached data | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not suspend and only refetch the stale query when one query has fresh and the other has stale cached data | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not suspend and only refetch the stale query when one query has stale and the other has fresh cached data | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQueries › should not suspend but refetch when all queries have stale cached data | not applicable | Suspense hook: nsh-query has no Suspense |

## react-query › useSuspenseQuery.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useSuspenseQuery › should render the correct amount of times in Suspense mode | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should return the correct states for a successful infinite query | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should not call the queryFn twice when used in Suspense mode | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should remove query instance when component unmounted | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should reset error state if new component instances are mounted | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should retry fetch if the reset error boundary has been reset | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should set staleTime when having passed a function | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should suspend when switching to a new query | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should retry fetch if the reset error boundary has been reset with global hook | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should throw errors to the error boundary by default | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should throw select errors to the error boundary by default | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should error caught in error boundary without infinite loop | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should error caught in error boundary without infinite loop when query keys changed | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should render the correct amount of times in Suspense mode when gcTime is set to 0 | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should not throw background errors to the error boundary | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should still suspense if queryClient has placeholderData config | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should log an error when skipToken is passed as queryFn | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should properly refresh data when refetchInterval is set | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should log an error when skipToken is used in development environment | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should not log an error when skipToken is used in production environment | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should release suspense when setQueryData is called while fetch is in-flight | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should release suspense when streamedQuery receives first chunk | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should release suspense when setQueryData is called before component mounts | not applicable | Suspense hook: nsh-query has no Suspense |
| useSuspenseQuery › should NOT release suspense when setQueryData is called with undefined | not applicable | Suspense hook: nsh-query has no Suspense |

## solid-query › QueryClientProvider.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| QueryClientProvider › should set a specific cache for all queries to use | ported | `QueryClientProvider.parity.test.tsx` › should set a specific cache for all queries to use |
| QueryClientProvider › should allow multiple caches to be partitioned | ported | `QueryClientProvider.parity.test.tsx` › should allow multiple caches to be partitioned |
| QueryClientProvider › should use defaultOptions for queries when they don't provide their own config | ported | `QueryClientProvider.parity.test.tsx` › should use defaultOptions for queries when they don't provide their own config |
| QueryClientProvider › useQueryClient › should throw an error if no query client has been set | ported | `QueryClientProvider.parity.test.tsx` › should throw an error if no query client has been set |
| QueryClientProvider › should not throw an error if user provides custom query client | ported | `QueryClientProvider.parity.test.tsx` › should not throw an error if user provides custom query client |
| QueryClientProvider › should create a query client resolver that is safe to call in reactive callbacks | not applicable | useQueryClientResolver is a solid-query internal that nsh-query does not have (useQueryClient is called in a component body). |
| QueryClientProvider › should defer missing provider errors until a resolver is called | not applicable | useQueryClientResolver is a solid-query internal that nsh-query does not have (useQueryClient is called in a component body). |

## solid-query › useInfiniteQuery.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useInfiniteQuery › should return the correct states for a successful query | ported | `useInfiniteQuery.parity.test.tsx` › should return the correct states for a successful query |
| useInfiniteQuery › should not throw when fetchNextPage returns an error | ported | `useInfiniteQuery.parity.test.tsx` › should not throw when fetchNextPage returns an error |
| useInfiniteQuery › should keep the previous data when placeholderData is set | ported | `useInfiniteQuery.parity.test.tsx` › should keep the previous data when placeholderData is set |
| useInfiniteQuery › should be able to select a part of the data | ported | `useInfiniteQuery.parity.test.tsx` › should be able to select a part of the data |
| useInfiniteQuery › should be able to select a new result and not cause infinite renders | ported | `useInfiniteQuery.parity.test.tsx` › should be able to select a new result and not cause infinite renders |
| useInfiniteQuery › should be able to reverse the data | ported | `useInfiniteQuery.parity.test.tsx` › should be able to reverse the data |
| useInfiniteQuery › should be able to fetch a previous page | ported | `useInfiniteQuery.parity.test.tsx` › should be able to fetch a previous page |
| useInfiniteQuery › should be able to refetch when providing page params automatically | ported | `useInfiniteQuery.parity.test.tsx` › should be able to refetch when providing page params automatically |
| useInfiniteQuery › should return the correct states when refetch fails | ported | `useInfiniteQuery.parity.test.tsx` › should return the correct states when refetch fails |
| useInfiniteQuery › should return the correct states when fetchNextPage fails | ported | `useInfiniteQuery.parity.test.tsx` › should return the correct states when fetchNextPage fails |
| useInfiniteQuery › should return the correct states when fetchPreviousPage fails | ported | `useInfiniteQuery.parity.test.tsx` › should return the correct states when fetchPreviousPage fails |
| useInfiniteQuery › should silently cancel any ongoing fetch when fetching more | ported | `useInfiniteQuery.parity.test.tsx` › should silently cancel any ongoing fetch when fetching more |
| useInfiniteQuery › should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked | ported | `useInfiniteQuery.parity.test.tsx` › should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked |
| useInfiniteQuery › should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used | ported | `useInfiniteQuery.parity.test.tsx` › should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used |
| useInfiniteQuery › should keep fetching first page when not loaded yet and triggering fetch more | ported | `useInfiniteQuery.parity.test.tsx` › should keep fetching first page when not loaded yet and triggering fetch more |
| useInfiniteQuery › should stop fetching additional pages when the component is unmounted and AbortSignal is consumed | ported | `useInfiniteQuery.parity.test.tsx` › should stop fetching additional pages when the component is unmounted and AbortSignal is consumed |
| useInfiniteQuery › should be able to set new pages with the query client | ported | `useInfiniteQuery.parity.test.tsx` › should be able to set new pages with the query client |
| useInfiniteQuery › should keep initialData visible alongside the error when a refetch fails | ported | `useInfiniteQuery.parity.test.tsx` › should keep initialData visible alongside the error when a refetch fails |
| useInfiniteQuery › should not fetch when queryFn is skipToken, and fetch once it is replaced | ported | `useInfiniteQuery.parity.test.tsx` › should not fetch when queryFn is skipToken, and fetch once it is replaced |
| useInfiniteQuery › should only refetch the first page when initialData is provided | ported | `useInfiniteQuery.parity.test.tsx` › should only refetch the first page when initialData is provided |
| useInfiniteQuery › should set hasNextPage to false if getNextPageParam returns undefined | ported | `useInfiniteQuery.parity.test.tsx` › should set hasNextPage to false if getNextPageParam returns undefined |
| useInfiniteQuery › should compute hasNextPage correctly using initialData | ported | `useInfiniteQuery.parity.test.tsx` › should compute hasNextPage correctly using initialData |
| useInfiniteQuery › should compute hasNextPage correctly for falsy getFetchMore return value using initialData | ported | `useInfiniteQuery.parity.test.tsx` › should compute hasNextPage correctly for falsy getFetchMore return value using initialData |
| useInfiniteQuery › should not use selected data when computing hasNextPage | ported | `useInfiniteQuery.parity.test.tsx` › should not use selected data when computing hasNextPage |
| useInfiniteQuery › should build fresh cursors on refetch | ported | `useInfiniteQuery.parity.test.tsx` › should build fresh cursors on refetch |
| useInfiniteQuery › should compute hasNextPage correctly for falsy getFetchMore return value on refetching | ported | `useInfiniteQuery.parity.test.tsx` › should compute hasNextPage correctly for falsy getFetchMore return value on refetching |
| useInfiniteQuery › should cancel the query function when there are no more subscriptions | ported | `useInfiniteQuery.parity.test.tsx` › should cancel the query function when there are no more subscriptions |
| useInfiniteQuery › should use provided custom queryClient | ported | `useInfiniteQuery.parity.test.tsx` › should use provided custom queryClient |
| useInfiniteQuery › should work with infiniteQueryOptions | ported | `useInfiniteQuery.parity.test.tsx` › should work with infiniteQueryOptions |

## solid-query › useIsFetching.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useIsFetching › should update as queries start and stop fetching | ported | `useIsFetching.parity.test.tsx` › should update as queries start and stop fetching |
| useIsFetching › should not update state while rendering | ported | `useIsFetching.parity.test.tsx` › should not update state while rendering |
| useIsFetching › should be able to filter | ported | `useIsFetching.parity.test.tsx` › should be able to filter |
| useIsFetching › should show the correct fetching state when mounted after a query | ported | `useIsFetching.parity.test.tsx` › should show the correct fetching state when mounted after a query |
| useIsFetching › should use provided custom queryClient | ported | `useIsFetching.parity.test.tsx` › should use provided custom queryClient |
| useIsFetching › should resubscribe when a custom queryClient changes | NSH differs | `useIsFetching.parity.test.tsx` › should resubscribe when a custom queryClient changes |

## solid-query › useIsMutating.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useIsMutating › should return the number of fetching mutations | ported | `useIsMutating.parity.test.tsx` › should return the number of fetching mutations |
| useIsMutating › should filter correctly by mutationKey | ported | `useIsMutating.parity.test.tsx` › should filter correctly by mutationKey |
| useIsMutating › should filter correctly by predicate | ported | `useIsMutating.parity.test.tsx` › should filter correctly by predicate |
| useIsMutating › should use provided custom queryClient | ported | `useIsMutating.parity.test.tsx` › should use provided custom queryClient |
| useIsMutating › should resubscribe when a custom queryClient changes | NSH differs | `useIsMutating.parity.test.tsx` › should resubscribe when a custom queryClient changes |
| useIsMutating › should not change state if unmounted | ported | `useIsMutating.parity.test.tsx` › should not change state if unmounted |

## solid-query › useMutation.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useMutation › should be able to reset `data` | ported | `useMutation.parity.test.tsx` › should be able to reset `data` |
| useMutation › should be able to reset `error` | ported | `useMutation.parity.test.tsx` › should be able to reset `error` |
| useMutation › should call mutate callbacks when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call mutate callbacks when useMutation has no callbacks |
| useMutation › should call mutate error callbacks when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call mutate error callbacks when useMutation has no callbacks |
| useMutation › should call only mutate onSuccess when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutate onSuccess when useMutation has no callbacks |
| useMutation › should call only mutate onError when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutate onError when useMutation has no callbacks |
| useMutation › should call only mutate onSettled when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutate onSettled when useMutation has no callbacks |
| useMutation › should call mutateAsync callbacks when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call mutateAsync callbacks when useMutation has no callbacks |
| useMutation › should call mutateAsync error callbacks when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call mutateAsync error callbacks when useMutation has no callbacks |
| useMutation › should call only mutateAsync onSuccess when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutateAsync onSuccess when useMutation has no callbacks |
| useMutation › should call only mutateAsync onError when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutateAsync onError when useMutation has no callbacks |
| useMutation › should call only mutateAsync onSettled when useMutation has no callbacks | ported | `useMutation.parity.test.tsx` › should call only mutateAsync onSettled when useMutation has no callbacks |
| useMutation › should be able to call `onSuccess` and `onSettled` after each successful mutate | ported | `useMutation.parity.test.tsx` › should be able to call `onSuccess` and `onSettled` after each successful mutate |
| useMutation › should set correct values for `failureReason` and `failureCount` on multiple mutate calls | ported | `useMutation.parity.test.tsx` › should set correct values for `failureReason` and `failureCount` on multiple mutate calls |
| useMutation › should be able to call `onError` and `onSettled` after each failed mutate | ported | `useMutation.parity.test.tsx` › should be able to call `onError` and `onSettled` after each failed mutate |
| useMutation › should be able to override the useMutation success callbacks | ported | `useMutation.parity.test.tsx` › should be able to override the useMutation success callbacks |
| useMutation › should be able to override the error callbacks when using mutateAsync | ported | `useMutation.parity.test.tsx` › should be able to override the error callbacks when using mutateAsync |
| useMutation › should be able to use mutation defaults | ported | `useMutation.parity.test.tsx` › should be able to use mutation defaults |
| useMutation › should be able to retry a failed mutation | ported | `useMutation.parity.test.tsx` › should be able to retry a failed mutation |
| useMutation › should not retry mutations while offline | ported | `useMutation.parity.test.tsx` › should not retry mutations while offline |
| useMutation › should call onMutate even if paused | ported | `useMutation.parity.test.tsx` › should call onMutate even if paused |
| useMutation › should optimistically go to paused state if offline | ported | `useMutation.parity.test.tsx` › should optimistically go to paused state if offline |
| useMutation › should be able to retry a mutation when online | ported | `useMutation.parity.test.tsx` › should be able to retry a mutation when online |
| useMutation › should not change state if unmounted | ported | `useMutation.parity.test.tsx` › should not change state if unmounted |
| useMutation › should be able to throw an error when throwOnError is set to true | ported | `useMutation.parity-b.test.tsx` › should be able to throw an error when throwOnError is set to true |
| useMutation › should be able to throw an error when throwOnError is a function that returns true | ported | `useMutation.parity-b.test.tsx` › should be able to throw an error when throwOnError is a function that returns true |
| useMutation › should pass meta to mutation on success | ported | `useMutation.parity-b.test.tsx` › should pass meta to mutation on success |
| useMutation › should pass meta to mutation on error | ported | `useMutation.parity-b.test.tsx` › should pass meta to mutation on error |
| useMutation › should call cache callbacks when unmounted | ported | `useMutation.parity-b.test.tsx` › should call cache callbacks when unmounted |
| useMutation › should call mutate callbacks only for the last observer | ported | `useMutation.parity-b.test.tsx` › should call mutate callbacks only for the last observer |
| useMutation › should go to error state if onSuccess callback errors | ported | `useMutation.parity-b.test.tsx` › should go to error state if onSuccess callback errors |
| useMutation › should go to error state if onError callback errors | ported | `useMutation.parity-b.test.tsx` › should go to error state if onError callback errors |
| useMutation › should go to error state if onSettled callback errors | ported | `useMutation.parity-b.test.tsx` › should go to error state if onSettled callback errors |
| useMutation › should use provided custom queryClient | ported | `useMutation.parity-b.test.tsx` › should use provided custom queryClient |
| useMutation › should update the cache in onMutate and roll back via onMutateResult in onError | ported | `useMutation.parity-b.test.tsx` › should update the cache in onMutate and roll back via onMutateResult in onError |
| useMutation › should keep the optimistic update in place when the mutation succeeds | ported | `useMutation.parity-b.test.tsx` › should keep the optimistic update in place when the mutation succeeds |
| useMutation › should be able to run multiple mutateAsync calls in parallel with Promise.all | ported | `useMutation.parity-b.test.tsx` › should be able to run multiple mutateAsync calls in parallel with Promise.all |
| useMutation › should handle Promise.all rejection when one parallel mutateAsync call fails | ported | `useMutation.parity-b.test.tsx` › should handle Promise.all rejection when one parallel mutateAsync call fails |
| useMutation › should handle partial failure in parallel mutateAsync calls with Promise.allSettled | ported | `useMutation.parity-b.test.tsx` › should handle partial failure in parallel mutateAsync calls with Promise.allSettled |
| useMutation › should pass a non-undefined onMutateResult alongside context to onSuccess | ported | `useMutation.parity-b.test.tsx` › should pass a non-undefined onMutateResult alongside context to onSuccess |
| useMutation › should give mutationFn the same QueryClient instance via context | ported | `useMutation.parity-b.test.tsx` › should give mutationFn the same QueryClient instance via context |
| useMutation › should include mutationKey in the context passed to hook-level callbacks | ported | `useMutation.parity-b.test.tsx` › should include mutationKey in the context passed to hook-level callbacks |
| useMutation › should let onSuccess invalidate queries via context.client without a useQueryClient() closure | ported | `useMutation.parity-b.test.tsx` › should let onSuccess invalidate queries via context.client without a useQueryClient() closure |

## solid-query › useMutationState.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useMutationState › should return all mutation states when called without options | ported | `useMutationState.parity.test.tsx` › useMutationState › should return all mutation states when called without options |
| useMutationState › should return variables after calling mutate | ported | `useMutationState.parity.test.tsx` › useMutationState › should return variables after calling mutate |

## solid-query › useQueries.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useQueries › should return the correct states | ported | `useQueries.parity.test.tsx` › should return the correct states |
| useQueries › should not change state if unmounted | ported | `useQueries.parity.test.tsx` › should not change state if unmounted |
| useQueries › should use provided custom queryClient | ported | `useQueries.parity.test.tsx` › should use provided custom queryClient |
| useQueries › should not fetch for the duration of the restoring period when isRestoring is true | ported | `useQueries.parity.test.tsx` › should not fetch for the duration of the restoring period when isRestoring is true |

## solid-query › useQuery.test.tsx

| Upstream test | Class | nsh-query test, or why not |
|---|---|---|
| useQuery › should allow to set default data value | ported | `useQuery.parity-solid-1.test.tsx` › should allow to set default data value |
| useQuery › should return the correct states for a successful query | ported | `useQuery.parity-solid-1.test.tsx` › should return the correct states for a successful query |
| useQuery › should return the correct states for an unsuccessful query | ported | `useQuery.parity-solid-1.test.tsx` › should return the correct states for an unsuccessful query |
| useQuery › should set isFetchedAfterMount to true after a query has been fetched | ported | `useQuery.parity-solid-1.test.tsx` › should set isFetchedAfterMount to true after a query has been fetched |
| useQuery › should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already | ported | `useQuery.parity-solid-1.test.tsx` › should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already |
| useQuery › should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already | ported | `useQuery.parity-solid-1.test.tsx` › should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already |
| useQuery › should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet | ported | `useQuery.parity-solid-1.test.tsx` › should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet |
| useQuery › should be able to watch a query without providing a query function | ported | `useQuery.parity-solid-1.test.tsx` › should be able to watch a query without providing a query function |
| useQuery › should pick up a query when re-mounting with gcTime 0 | ported | `useQuery.parity-solid-1.test.tsx` › should pick up a query when re-mounting with gcTime 0 |
| useQuery › should fetch when refetchOnMount is false and nothing has been fetched yet | ported | `useQuery.parity-solid-1.test.tsx` › should fetch when refetchOnMount is false and nothing has been fetched yet |
| useQuery › should not fetch when refetchOnMount is false and data has been fetched already | ported | `useQuery.parity-solid-1.test.tsx` › should not fetch when refetchOnMount is false and data has been fetched already |
| useQuery › should be able to select a part of the data with select | ported | `useQuery.parity-solid-1.test.tsx` › should be able to select a part of the data with select |
| useQuery › should be able to select a part of the data with select in object syntax 2 | ported | `useQuery.parity-solid-1.test.tsx` › should be able to select a part of the data with select in object syntax 2 |
| useQuery › should be able to select a part of the data with select in object syntax 1 | ported | `useQuery.parity-solid-1.test.tsx` › should be able to select a part of the data with select in object syntax 1 |
| useQuery › should not re-render when it should only re-render only data change and the selected data did not change | ported | `useQuery.parity-solid-1.test.tsx` › should not re-render when it should only re-render only data change and the selected data did not change |
| useQuery › should throw an error when a selector throws | ported | `useQuery.parity-solid-1.test.tsx` › should throw an error when a selector throws |
| useQuery › should track properties and only re-render when a tracked property changes | ported | `useQuery.parity-solid-1.test.tsx` › should track properties and only re-render when a tracked property changes |
| useQuery › should always re-render if we are tracking props but not using any | ported | `useQuery.parity-solid-1.test.tsx` › should always re-render if we are tracking props but not using any |
| useQuery › should maintain referential equality when reconcile option is a string key | not applicable | Tests solid's `reconcile` option (string key), which nsh-query does not have. |
| useQuery › should share equal data structures between query results | NSH differs | `useQuery.parity-solid-1.test.tsx` › should share equal data structures between query results |
| useQuery › should use query function from hook when the existing query does not have a query function | ported | `useQuery.parity-solid-1.test.tsx` › should use query function from hook when the existing query does not have a query function |
| useQuery › should update query stale state and refetch when invalidated with invalidateQueries | ported | `useQuery.parity-solid-1.test.tsx` › should update query stale state and refetch when invalidated with invalidateQueries |
| useQuery › should not update disabled query when refetch with refetchQueries | ported | `useQuery.parity-solid-1.test.tsx` › should not update disabled query when refetch with refetchQueries |
| useQuery › should not refetch disabled query when invalidated with invalidateQueries | ported | `useQuery.parity-solid-1.test.tsx` › should not refetch disabled query when invalidated with invalidateQueries |
| useQuery › should not fetch when switching to a disabled query | ported | `useQuery.parity-solid-1.test.tsx` › should not fetch when switching to a disabled query |
| useQuery › should keep the previous data when placeholderData is set | ported | `useQuery.parity-solid-1.test.tsx` › should keep the previous data when placeholderData is set |
| useQuery › should not show initial data from next query if placeholderData is set | ported | `useQuery.parity-solid-1.test.tsx` › should not show initial data from next query if placeholderData is set |
| useQuery › should keep the previous data on disabled query when placeholderData is set and switching query key multiple times | ported | `useQuery.parity-solid-1.test.tsx` › should keep the previous data on disabled query when placeholderData is set and switching query key multiple times |
| useQuery › should use the correct query function when components use different configurations | ported | `useQuery.parity-solid-1.test.tsx` › should use the correct query function when components use different configurations |
| useQuery › should be able to set different stale times for a query | ported | `useQuery.parity-solid-1.test.tsx` › should be able to set different stale times for a query |
| useQuery › should re-render when a query becomes stale | ported | `useQuery.parity-solid-1.test.tsx` › should re-render when a query becomes stale |
| useQuery › should not re-render when it should only re-render on data changes and the data did not change | ported | `useQuery.parity-solid-1.test.tsx` › should not re-render when it should only re-render on data changes and the data did not change |
| useQuery › should not override initial data in dependent queries | ported | `useQuery.parity-solid-1b.test.tsx` › should not override initial data in dependent queries |
| useQuery › should update query options | ported | `useQuery.parity-solid-1b.test.tsx` › should update query options |
| useQuery › should batch re-renders | ported | `useQuery.parity-solid-1b.test.tsx` › should batch re-renders |
| useQuery › should render latest data even if react has discarded certain renders | ported | `useQuery.parity-solid-1b.test.tsx` › should render latest data even if react has discarded certain renders |
| useQuery › should start with status pending, fetchStatus idle if enabled is false | ported | `useQuery.parity-solid-1b.test.tsx` › should start with status pending, fetchStatus idle if enabled is false |
| useQuery › should be in "pending" state by default | ported | `useQuery.parity-solid-1b.test.tsx` › should be in "pending" state by default |
| useQuery › should not refetch query on focus when `enabled` is set to `false` | ported | `useQuery.parity-solid-1b.test.tsx` › should not refetch query on focus when `enabled` is set to `false` |
| useQuery › should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false` | ported | `useQuery.parity-solid-1b.test.tsx` › should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false` |
| useQuery › should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false` | ported | `useQuery.parity-solid-1b.test.tsx` › should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false` |
| useQuery › should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true` | ported | `useQuery.parity-solid-1b.test.tsx` › should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true` |
| useQuery › should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always` | ported | `useQuery.parity-solid-1b.test.tsx` › should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always` |
| useQuery › should calculate focus behavior for refetchOnWindowFocus depending on function | ported | `useQuery.parity-solid-1b.test.tsx` › should calculate focus behavior for refetchOnWindowFocus depending on function |
| useQuery › should refetch fresh query when refetchOnMount is set to always | ported | `useQuery.parity-solid-1b.test.tsx` › should refetch fresh query when refetchOnMount is set to always |
| useQuery › should refetch stale query when refetchOnMount is set to true | ported | `useQuery.parity-solid-1b.test.tsx` › should refetch stale query when refetchOnMount is set to true |
| useQuery › should set status to error if queryFn throws | ported | `useQuery.parity-solid-1b.test.tsx` › should set status to error if queryFn throws |
| useQuery › should throw error if queryFn throws and throwOnError is in use | ported | `useQuery.parity-solid-1b.test.tsx` › should throw error if queryFn throws and throwOnError is in use |
| useQuery › should throw error inside the same component if queryFn throws and throwOnError is in use | ported | `useQuery.parity-solid-1b.test.tsx` › should throw error inside the same component if queryFn throws and throwOnError is in use |
| useQuery › should throw error inside the same component if queryFn throws and show the correct error message | ported | `useQuery.parity-solid-1b.test.tsx` › should throw error inside the same component if queryFn throws and show the correct error message |
| useQuery › should show the correct error message on the error property when accessed outside error boundary | ported | `useQuery.parity-solid-1b.test.tsx` › should show the correct error message on the error property when accessed outside error boundary |
| useQuery › should update with data if we observe no properties and throwOnError | ported | `useQuery.parity-solid-1b.test.tsx` › should update with data if we observe no properties and throwOnError |
| useQuery › should set status to error instead of throwing when error should not be thrown | ported | `useQuery.parity-solid-1b.test.tsx` › should set status to error instead of throwing when error should not be thrown |
| useQuery › should throw error instead of setting status when error should be thrown | ported | `useQuery.parity-solid-1b.test.tsx` › should throw error instead of setting status when error should be thrown |
| useQuery › should continue retries when observers unmount and remount while waiting for a retry (#3031) | ported | `useQuery.parity-solid-1b.test.tsx` › should continue retries when observers unmount and remount while waiting for a retry (#3031) |
| useQuery › should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031) | ported | `useQuery.parity-solid-1b.test.tsx` › should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031) |
| useQuery › should always fetch if refetchOnMount is set to always | ported | `useQuery.parity-solid-1b.test.tsx` › should always fetch if refetchOnMount is set to always |
| useQuery › should fetch if initial data is set | ported | `useQuery.parity-solid-1b.test.tsx` › should fetch if initial data is set |
| useQuery › should keep initialData visible alongside the error when a refetch fails | ported | `useQuery.parity-solid-1b.test.tsx` › should keep initialData visible alongside the error when a refetch fails |
| useQuery › should not fetch if initial data is set with a stale time | ported | `useQuery.parity-solid-1b.test.tsx` › should not fetch if initial data is set with a stale time |
| useQuery › should fetch if initial data updated at is older than stale time | ported | `useQuery.parity-solid-1b.test.tsx` › should fetch if initial data updated at is older than stale time |
| useQuery › should fetch if "initial data updated at" is exactly 0 | ported | `useQuery.parity-solid-1b.test.tsx` › should fetch if "initial data updated at" is exactly 0 |
| useQuery › should keep initial data when the query key changes | ported | `useQuery.parity-solid-1b.test.tsx` › should keep initial data when the query key changes |
| useQuery › should retry specified number of times | ported | `useQuery.parity-solid-1b.test.tsx` › should retry specified number of times |
| useQuery › should not retry if retry function `false` | ported | `useQuery.parity-solid-2.test.tsx` › should not retry if retry function `false` |
| useQuery › should extract retryDelay from error | ported | `useQuery.parity-solid-2.test.tsx` › should extract retryDelay from error |
| useQuery › should continue retry after focus regain | ported | `useQuery.parity-solid-2.test.tsx` › should continue retry after focus regain |
| useQuery › should fetch on mount when a query was already created with setQueryData | ported | `useQuery.parity-solid-2.test.tsx` › should fetch on mount when a query was already created with setQueryData |
| useQuery › should refetch after focus regain | ported | `useQuery.parity-solid-2.test.tsx` › should refetch after focus regain |
| useQuery › should refetch if stale after a prefetch | ported | `useQuery.parity-solid-2.test.tsx` › should refetch if stale after a prefetch |
| useQuery › should not refetch if not stale after a prefetch | ported | `useQuery.parity-solid-2.test.tsx` › should not refetch if not stale after a prefetch |
| useQuery › should reset failureCount and failureReason on successful fetch | ported | `useQuery.parity-solid-2.test.tsx` › should reset failureCount and failureReason on successful fetch |
| useQuery › should use prefetched data for dependent query | ported | `useQuery.parity-solid-2.test.tsx` › should use prefetched data for dependent query |
| useQuery › should support dependent queries via the enable config option | ported | `useQuery.parity-solid-2.test.tsx` › should support dependent queries via the enable config option |
| useQuery › should cleanup observers after component that created the query is unmounted in race condition #1 | ported | `useQuery.parity-solid-2.test.tsx` › should cleanup observers after component that created the query is unmounted in race condition #1 |
| useQuery › should cleanup observers after component that created the query is unmounted in race condition #2 | ported | `useQuery.parity-solid-2.test.tsx` › should cleanup observers after component that created the query is unmounted in race condition #2 |
| useQuery › should mark query as fetching, when using initialData | ported | `useQuery.parity-solid-2.test.tsx` › should mark query as fetching, when using initialData |
| useQuery › should initialize state properly, when initialData is falsy | ported | `useQuery.parity-solid-2.test.tsx` › should initialize state properly, when initialData is falsy |
| useQuery › should persist data when enabled is changed to false | ported | `useQuery.parity-solid-2.test.tsx` › should persist data when enabled is changed to false |
| useQuery › should support enabled:false in query object syntax | ported | `useQuery.parity-solid-2.test.tsx` › should support enabled:false in query object syntax |
| useQuery › should init to status:pending, fetchStatus:idle when enabled is false | ported | `useQuery.parity-solid-2.test.tsx` › should init to status:pending, fetchStatus:idle when enabled is false |
| useQuery › should not schedule garbage collection, if gcTimeout is set to `Infinity` | ported | `useQuery.parity-solid-2.test.tsx` › should not schedule garbage collection, if gcTimeout is set to `Infinity` |
| useQuery › should schedule garbage collection, if gcTimeout is not set to `Infinity` | ported | `useQuery.parity-solid-2.test.tsx` › should schedule garbage collection, if gcTimeout is not set to `Infinity` |
| useQuery › should not cause memo churn when data does not change | NSH differs | `useQuery.parity-solid-2.test.tsx` › should not cause memo churn when data does not change |
| useQuery › should update data upon interval changes | ported | `useQuery.parity-solid-2.test.tsx` › should update data upon interval changes |
| useQuery › should refetch in an interval depending on function result | ported | `useQuery.parity-solid-2.test.tsx` › should refetch in an interval depending on function result |
| useQuery › should not interval fetch with a refetchInterval of 0 | ported | `useQuery.parity-solid-2.test.tsx` › should not interval fetch with a refetchInterval of 0 |
| useQuery › should accept an empty string as query key | ported | `useQuery.parity-solid-2.test.tsx` › should accept an empty string as query key |
| useQuery › should accept an object as query key | ported | `useQuery.parity-solid-2.test.tsx` › should accept an object as query key |
| useQuery › should refetch if any query instance becomes enabled | ported | `useQuery.parity-solid-2.test.tsx` › should refetch if any query instance becomes enabled |
| useQuery › should use placeholder data while the query loads | ported | `useQuery.parity-solid-2.test.tsx` › should use placeholder data while the query loads |
| useQuery › should use placeholder data even for disabled queries | ported | `useQuery.parity-solid-2.test.tsx` › should use placeholder data even for disabled queries |
| useQuery › should run placeholder data through select | ported | `useQuery.parity-solid-2.test.tsx` › should run placeholder data through select |
| useQuery › should run placeholder data function result through select | ported | `useQuery.parity-solid-2.test.tsx` › should run placeholder data function result through select |
| useQuery › should always return the correct state from select | ported | `useQuery.parity-solid-2.test.tsx` › should always return the correct state from select |
| useQuery › should structurally share data in select | ported | `useQuery.parity-solid-2.test.tsx` › should structurally share data in select |
| useQuery › should correctly maintain referential equality in the reconcile fn callback | not applicable | Tests solid-query's `reconcile` option with solid-js/store's `reconcile`; nsh-query has no such option. |
| useQuery › should cancel the query function when there are no more subscriptions | ported | `useQuery.parity-solid-2b.test.tsx` › should cancel the query function when there are no more subscriptions |
| useQuery › should cancel the query if the signal was consumed and there are no more subscriptions | ported | `useQuery.parity-solid-2b.test.tsx` › should cancel the query if the signal was consumed and there are no more subscriptions |
| useQuery › should refetch when quickly switching to a failed query | ported | `useQuery.parity-solid-2b.test.tsx` › should refetch when quickly switching to a failed query |
| useQuery › should update query state and refetch when reset with resetQueries | ported | `useQuery.parity-solid-2b.test.tsx` › should update query state and refetch when reset with resetQueries |
| useQuery › should update query state and not refetch when resetting a disabled query with resetQueries | ported | `useQuery.parity-solid-2b.test.tsx` › should update query state and not refetch when resetting a disabled query with resetQueries |
| useQuery › should only call the query hash function once | ported | `useQuery.parity-solid-2b.test.tsx` › should only call the query hash function once |
| useQuery › should refetch when changed enabled to true in error state | ported | `useQuery.parity-solid-2b.test.tsx` › should refetch when changed enabled to true in error state |
| useQuery › should refetch when query key changed when previous status is error | ported | `useQuery.parity-solid-2b.test.tsx` › should refetch when query key changed when previous status is error |
| useQuery › should refetch when query key changed when switching between erroneous queries | ported | `useQuery.parity-solid-2b.test.tsx` › should refetch when query key changed when switching between erroneous queries |
| useQuery › should have no error in pending state when refetching after error occurred | ported | `useQuery.parity-solid-2b.test.tsx` › should have no error in pending state when refetching after error occurred |
| useQuery › networkMode online › should not start fetching online queries if you are offline | ported | `useQuery.parity-solid-2b.test.tsx` › should not start fetching online queries if you are offline |
| useQuery › networkMode online › should not refetch online queries if you are offline | ported | `useQuery.parity-solid-2b.test.tsx` › should not refetch online queries if you are offline |
| useQuery › networkMode online › should not refetch online queries if you are offline and refocus | ported | `useQuery.parity-solid-2b.test.tsx` › should not refetch online queries if you are offline and refocus |
| useQuery › networkMode online › should not refetch online queries while already paused | ported | `useQuery.parity-solid-2b.test.tsx` › should not refetch online queries while already paused |
| useQuery › networkMode online › should not refetch online queries while already paused if data is in the cache | ported | `useQuery.parity-solid-2b.test.tsx` › should not refetch online queries while already paused if data is in the cache |
| useQuery › networkMode online › should not get online queries stuck in fetching state when pausing multiple times | ported | `useQuery.parity-solid-2b.test.tsx` › should not get online queries stuck in fetching state when pausing multiple times |
| useQuery › networkMode online › should pause retries of online queries if you are offline | ported | `useQuery.parity-solid-2b.test.tsx` › should pause retries of online queries if you are offline |
| useQuery › networkMode online › should not fetch online queries if paused initial load and we go online after unmount | ported | `useQuery.parity-solid-2b.test.tsx` › should not fetch online queries if paused initial load and we go online after unmount |
| useQuery › networkMode online › should re-fetch online queries if paused and we go online even if already unmounted (because not cancelled) | ported | `useQuery.parity-solid-2b.test.tsx` › should re-fetch online queries if paused and we go online even if already unmounted (because not cancelled) |
| useQuery › networkMode online › should not fetch online queries if paused and we go online when cancelled and no refetchOnReconnect | ported | `useQuery.parity-solid-2b.test.tsx` › should not fetch online queries if paused and we go online when cancelled and no refetchOnReconnect |
| useQuery › networkMode online › should fetch online queries if paused and we go online even if already unmounted when refetch was not cancelled | ported | `useQuery.parity-solid-2b.test.tsx` › should fetch online queries if paused and we go online even if already unmounted when refetch was not cancelled |
| useQuery › networkMode always › should start fetching always queries even if you are offline | ported | `useQuery.parity-solid-2b.test.tsx` › should start fetching always queries even if you are offline |
| useQuery › networkMode always › should not pause retries of always queries | ported | `useQuery.parity-solid-2b.test.tsx` › should not pause retries of always queries |
| useQuery › networkMode offlineFirst › should start fetching offlineFirst queries if you are offline, but pause retries | ported | `useQuery.parity-solid-2b.test.tsx` › should start fetching offlineFirst queries if you are offline, but pause retries |
| useQuery › should have status=error on mount when a query has failed | ported | `useQuery.parity-solid-2b.test.tsx` › should have status=error on mount when a query has failed |
| useQuery › should respect updatedAt in setQueryData | ported | `useQuery.parity-solid-2b.test.tsx` › should respect updatedAt in setQueryData |
| useQuery › should increase errorUpdateCount on each fetch failure | ported | `useQuery.parity-solid-2b.test.tsx` › should increase errorUpdateCount on each fetch failure |
| useQuery › should not fetch while restoring and refetch after restoring is complete | ported | `useQuery.parity-solid-2b.test.tsx` › should not fetch while restoring and refetch after restoring is complete |
| useQuery › should use provided custom queryClient | ported | `useQuery.parity-solid-2b.test.tsx` › should use provided custom queryClient |
| useQuery › should refetch query when queryClient changes | not applicable | solid-query's second argument is a client accessor that can change; nsh-query's is a QueryClient read once, so the client cannot change under a mounted query. |
| useQuery › should not fetch when queryFn is skipToken, and fetch once postId is set | ported | `useQuery.parity-solid-2b.test.tsx` › should not fetch when queryFn is skipToken, and fetch once postId is set |
