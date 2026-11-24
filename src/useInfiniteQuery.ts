import { InfiniteQueryObserver } from "./core";
import type { DefaultError, InfiniteData, QueryKey, QueryObserver } from "./core";
import type { DefinedInitialDataInfiniteOptions, UndefinedInitialDataInfiniteOptions } from "./infiniteQueryOptions";
import type { QueryClient } from "./QueryClient";
import type { DefinedUseInfiniteQueryResult, UseInfiniteQueryOptions, UseInfiniteQueryResult } from "./types";
import { useBaseQuery } from "./useBaseQuery";

/**
 * Subscribes the component to a query that loads its data page by page. The
 * options are those of `useQuery` plus `initialPageParam`, `getNextPageParam`,
 * `getPreviousPageParam` and `maxPages`; the result adds `fetchNextPage`,
 * `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`
 * and `isFetchingPreviousPage`. Read it by property, as `useQuery`'s.
 *
 * @param queryClient - The client to use instead of the provided one.
 *
 * @example
 * ```tsx
 * function Posts() {
 *   const posts = useInfiniteQuery(() => ({
 *     queryKey: ["posts"],
 *     queryFn: ({ pageParam }) => fetch(`${base}/posts?page=${pageParam}`).then((r) => r.json()),
 *     initialPageParam: 1,
 *     getNextPageParam: (lastPage) => lastPage.next ?? undefined,
 *   }));
 *   return (
 *     <List
 *       each={posts.data?.pages.flatMap((page) => page.items) ?? []}
 *       onLoadMore={() => posts.hasNextPage && !posts.isFetching && posts.fetchNextPage()}
 *     >
 *       {(post) => <Text>{post().title}</Text>}
 *     </List>
 *   );
 * }
 * ```
 */
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  queryClient?: QueryClient,
): DefinedUseInfiniteQueryResult<TData, TError>;
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>;
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>;
export function useInfiniteQuery(options: UseInfiniteQueryOptions, queryClient?: QueryClient) {
  return useBaseQuery(options, InfiniteQueryObserver as typeof QueryObserver, queryClient);
}
