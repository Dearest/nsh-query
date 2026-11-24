import type { Accessor } from "nsh";
import type {
  DefaultError,
  InfiniteData,
  InitialDataFunction,
  NonUndefinedGuard,
  QueryKey,
  QueryKeyWithDataTag,
} from "./core";
import type { InfiniteQueryOptions } from "./types";

/** Infinite query options whose `initialData` may be missing: `data` may be `undefined`. */
export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    initialData?:
      | undefined
      | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      | InitialDataFunction<NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>>;
  }
>;

/** Infinite query options whose `initialData` is defined: `data` is never `undefined`. */
export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    initialData:
      | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>);
  }
>;

/**
 * Returns `options` as they are, typed so that `queryKey` carries the data type.
 * Share the result between `useInfiniteQuery` and the client's imperative
 * methods (`queryClient.prefetchInfiniteQuery`).
 *
 * @example
 * ```tsx
 * const postsOptions = infiniteQueryOptions({
 *   queryKey: ["posts"],
 *   queryFn: ({ pageParam }) => fetchPosts(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.next,
 * });
 *
 * function Posts() {
 *   const posts = useInfiniteQuery(() => postsOptions);
 *   return <Text>{`${posts.data?.pages.length ?? 0} pages`}</Text>;
 * }
 * ```
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ReturnType<DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>>,
): ReturnType<DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ReturnType<UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>>,
): ReturnType<UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
export function infiniteQueryOptions(options: unknown) {
  return options;
}
