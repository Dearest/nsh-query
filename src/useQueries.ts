import { cleanup, computed, effect, signal, untracked } from "nsh";
import type { Accessor } from "nsh";
import { notifyManager, QueriesObserver, shouldThrowError } from "./core";
import type {
  DefaultError,
  OmitKeyof,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  ThrowOnError,
} from "./core";
import { useIsRestoring } from "./isRestoring";
import type { QueryClient } from "./QueryClient";
import { useQueryClient } from "./QueryClientProvider";
import { readonlyView } from "./readonlyView";
import type { QueryOptions, UseQueryResult } from "./types";

// The options of one query in `useQueries`: `placeholderData` takes no
// previous data.
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<QueryOptions<TQueryFnData, TError, TData, TQueryKey>, "placeholderData"> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>;
};

// Avoid TS depth-limit errors on large tuples.
type MAXIMUM_DEPTH = 20;

// Widen the type of the symbol so that inference works although skipToken is a unique symbol.
type SkipTokenForUseQueries = symbol;

type GetOptions<T> = T extends { queryFnData: infer TQueryFnData; error?: infer TError; data: infer TData }
  ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData>
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? UseQueryOptionsForUseQueries<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
      ? UseQueryOptionsForUseQueries<unknown, TError, TData>
      : T extends [infer TQueryFnData, infer TError, infer TData]
        ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData>
        : T extends [infer TQueryFnData, infer TError]
          ? UseQueryOptionsForUseQueries<TQueryFnData, TError>
          : T extends [infer TQueryFnData]
            ? UseQueryOptionsForUseQueries<TQueryFnData>
            : T extends {
                  queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey> | SkipTokenForUseQueries;
                  select?: (data: any) => infer TData;
                  throwOnError?: ThrowOnError<any, infer TError, any, any>;
                }
              ? UseQueryOptionsForUseQueries<
                  TQueryFnData,
                  unknown extends TError ? DefaultError : TError,
                  unknown extends TData ? TQueryFnData : TData,
                  TQueryKey
                >
              : UseQueryOptionsForUseQueries;

type GetResults<T> = T extends { queryFnData: any; error?: infer TError; data: infer TData }
  ? UseQueryResult<TData, TError>
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? UseQueryResult<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
      ? UseQueryResult<TData, TError>
      : T extends [any, infer TError, infer TData]
        ? UseQueryResult<TData, TError>
        : T extends [infer TQueryFnData, infer TError]
          ? UseQueryResult<TQueryFnData, TError>
          : T extends [infer TQueryFnData]
            ? UseQueryResult<TQueryFnData>
            : T extends {
                  queryFn?: QueryFunction<infer TQueryFnData, any> | SkipTokenForUseQueries;
                  select?: (data: any) => infer TData;
                  throwOnError?: ThrowOnError<any, infer TError, any, any>;
                }
              ? UseQueryResult<unknown extends TData ? TQueryFnData : TData, unknown extends TError ? DefaultError : TError>
              : UseQueryResult;

/** The options of each query of `useQueries`, inferred one by one. */
export type QueriesOptions<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth["length"] extends MAXIMUM_DEPTH
  ? Array<UseQueryOptionsForUseQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetOptions<Head>]
      : T extends [infer Head, ...infer Tail]
        ? QueriesOptions<[...Tail], [...TResult, GetOptions<Head>], [...TDepth, 1]>
        : ReadonlyArray<unknown> extends T
          ? T
          : T extends Array<UseQueryOptionsForUseQueries<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>>
            ? Array<UseQueryOptionsForUseQueries<TQueryFnData, TError, TData, TQueryKey>>
            : Array<UseQueryOptionsForUseQueries>;

/** The result of each query of `useQueries`, inferred one by one. */
export type QueriesResults<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth["length"] extends MAXIMUM_DEPTH
  ? Array<UseQueryResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetResults<Head>]
      : T extends [infer Head, ...infer Tail]
        ? QueriesResults<[...Tail], [...TResult, GetResults<Head>], [...TDepth, 1]>
        : { [K in keyof T]: GetResults<T[K]> };

/**
 * Subscribes the component to several queries, as many as `queries` has; the
 * list can grow and shrink. Without `combine` it returns an array of results,
 * each read by property like `useQuery`'s; with `combine`, what `combine`
 * returns (an object or an array), recomputed when the results change.
 *
 * @param queryClient - The client to use instead of the provided one.
 *
 * @example
 * ```tsx
 * function Users(props: { ids: number[] }) {
 *   const users = useQueries(() => ({
 *     queries: props.ids.map((id) => ({
 *       queryKey: ["users", id],
 *       queryFn: () => fetch(`${base}/users/${id}`).then((r) => r.json()),
 *     })),
 *     combine: (results) => ({
 *       names: results.map((result) => result.data?.name),
 *       pending: results.some((result) => result.isPending),
 *     }),
 *   }));
 *   return <Text>{users.pending ? "Loading" : users.names.join(", ")}</Text>;
 * }
 * ```
 */
export function useQueries<T extends Array<any>, TCombinedResult extends object = QueriesResults<T>>(
  queriesOptions: Accessor<{
    queries: readonly [...QueriesOptions<T>] | readonly [...{ [K in keyof T]: GetOptions<T[K]> }];
    combine?: (result: QueriesResults<T>) => TCombinedResult;
  }>,
  queryClient?: QueryClient,
): TCombinedResult {
  const client = useQueryClient(queryClient);
  const isRestoring = useIsRestoring();

  const defaulted = computed(() => {
    const { queries, combine } = queriesOptions();
    const restoring = isRestoring();
    return {
      queries: queries.map((options) => {
        const defaultedOptions = client.defaultQueryOptions(options as QueryObserverOptions);
        defaultedOptions._optimisticResults = restoring ? "isRestoring" : "optimistic";
        return defaultedOptions;
      }),
      options: (combine ? { combine } : undefined) as QueriesObserverOptions<TCombinedResult> | undefined,
    };
  });

  const initial = untracked(defaulted);
  const observer = new QueriesObserver<TCombinedResult>(client, initial.queries, initial.options);
  const version = signal(0);

  effect(() => {
    if (isRestoring()) return;
    untracked(() => cleanup(observer.subscribe(notifyManager.batchCalls(() => version.update((n) => n + 1)))));
  });

  effect(() => {
    const next = defaulted();
    if (next === initial) return;
    untracked(() => observer.setQueries(next.queries, next.options));
  });

  const combined = computed(() => {
    version();
    const { queries, options } = defaulted();
    return untracked(() => {
      const [results, getCombinedResult, trackResult] = observer.getOptimisticResult(queries, options?.combine);
      const queryCache = client.getQueryCache();
      results.forEach((result, index) => {
        const query = queries[index];
        if (
          query &&
          result.isError &&
          !result.isFetching &&
          shouldThrowError(query.throwOnError, [result.error, queryCache.get(query.queryHash)!])
        ) {
          throw result.error;
        }
      });
      return getCombinedResult(trackResult()) as TCombinedResult;
    });
  });

  return readonlyView(combined);
}
