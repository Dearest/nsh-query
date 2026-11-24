import { QueryObserver } from "./core";
import type { DefaultError, QueryKey } from "./core";
import type { QueryClient } from "./QueryClient";
import type { DefinedInitialDataOptions, UndefinedInitialDataOptions } from "./queryOptions";
import type { DefinedUseQueryResult, UseQueryOptions, UseQueryResult } from "./types";
import { useBaseQuery } from "./useBaseQuery";

/**
 * Subscribes the component to a query. `options` is a function: the signals and
 * props it reads update the query when they change (a new `queryKey` switches
 * to that query), and the observer is kept.
 *
 * The result is read by property (`todo.data`, `todo.isPending`,
 * `todo.refetch()`), reactively where it is read: in JSX, `computed` and
 * `effect`. Do not destructure it. Call `useQuery` in a component body.
 *
 * @param queryClient - The client to use instead of the provided one.
 *
 * @example
 * ```tsx
 * function Todo(props: { id: number }) {
 *   const todo = useQuery(() => ({
 *     queryKey: ["todos", props.id],
 *     queryFn: ({ signal }) => fetch(`${base}/todos/${props.id}`, { signal }).then((r) => r.json()),
 *   }));
 *   return (
 *     <View>
 *       <If when={todo.isPending}><Text>Loading</Text></If>
 *       <Text>{todo.data?.title}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError>;
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>;
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>;
export function useQuery(options: UseQueryOptions, queryClient?: QueryClient) {
  return useBaseQuery(options, QueryObserver, queryClient);
}
