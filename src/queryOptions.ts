import type { Accessor } from "nsh";
import type { DefaultError, InitialDataFunction, NonUndefinedGuard, QueryKey, QueryKeyWithDataTag } from "./core";
import type { QueryOptions } from "./types";

/** Options whose `initialData` may be missing: `data` may be `undefined`. */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined | InitialDataFunction<NonUndefinedGuard<TQueryFnData>> | NonUndefinedGuard<TQueryFnData>;
  }
>;

/** Options whose `initialData` is defined: `data` is never `undefined`. */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: NonUndefinedGuard<TQueryFnData> | (() => NonUndefinedGuard<TQueryFnData>);
  }
>;

/**
 * Returns `options` as they are, typed so that `queryKey` carries the data type:
 * `queryClient.getQueryData(todoOptions(1).queryKey)` is then typed too. Share
 * the result between `useQuery` and the client's imperative methods.
 *
 * @example
 * ```tsx
 * const todoOptions = (id: number) =>
 *   queryOptions({
 *     queryKey: ["todos", id],
 *     queryFn: () => fetch(`${base}/todos/${id}`).then((r) => r.json() as Promise<Todo>),
 *   });
 *
 * function Todo(props: { id: number }) {
 *   const todo = useQuery(() => todoOptions(props.id));
 *   return <Text>{todo.data?.title}</Text>;
 * }
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>>,
): ReturnType<DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>>,
): ReturnType<UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
export function queryOptions(options: unknown) {
  return options;
}
