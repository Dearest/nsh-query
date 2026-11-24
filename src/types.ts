import type { Accessor } from "nsh";
import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  OmitKeyof,
  Override,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from "./core";

/** The options of a query observer, as `useQuery` takes them (returned by its accessor). */
export interface UseBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, "suspense"> {
  /**
   * `false` detaches the observer from the query cache: no fetches, no polling,
   * no cache updates, and the query does not count this observer as active.
   * The result stays as it was. Back to `true`, it subscribes again and
   * refetches stale data, as on mount. For pages hidden but kept mounted.
   * @defaultValue true
   */
  subscribed?: boolean;
}

/** What the accessor passed to `useQuery` returns, and what `queryOptions` takes. */
export interface QueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> {}

/**
 * The first argument of `useQuery`: a function returning the options. Signals
 * and props it reads update the query when they change.
 */
export type UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<QueryOptions<TQueryFnData, TError, TData, TQueryKey>>;

/** The result of a query observer, read by property. */
export type UseBaseQueryResult<TData = unknown, TError = DefaultError> = QueryObserverResult<TData, TError>;

/**
 * What `useQuery` returns: a read-only object whose properties are reactive
 * where they are read (a JSX binding, `computed`, `effect`). Do not destructure it.
 */
export type UseQueryResult<TData = unknown, TError = DefaultError> = UseBaseQueryResult<TData, TError>;

/** What `useQuery` returns when `initialData` guarantees `data` is defined. */
export type DefinedUseBaseQueryResult<TData = unknown, TError = DefaultError> = DefinedQueryObserverResult<
  TData,
  TError
>;

/** What `useQuery` returns when `initialData` guarantees `data` is defined. */
export type DefinedUseQueryResult<TData = unknown, TError = DefaultError> = DefinedUseBaseQueryResult<TData, TError>;

/** What the accessor passed to `useInfiniteQuery` returns, and what `infiniteQueryOptions` takes. */
export interface InfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
    InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
    "queryKey" | "suspense"
  > {
  queryKey: TQueryKey;
  /**
   * `false` detaches the observer from the query cache, as `useQuery`'s `subscribed`.
   * @defaultValue true
   */
  subscribed?: boolean;
}

/** The first argument of `useInfiniteQuery`: a function returning the options. */
export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>>;

/** What `useInfiniteQuery` returns, read by property. */
export type UseInfiniteQueryResult<TData = unknown, TError = DefaultError> = InfiniteQueryObserverResult<TData, TError>;

/** What `useInfiniteQuery` returns when `initialData` guarantees `data` is defined. */
export type DefinedUseInfiniteQueryResult<TData = unknown, TError = DefaultError> = DefinedInfiniteQueryObserverResult<
  TData,
  TError
>;

/** What the accessor passed to `useMutation` returns, and what `mutationOptions` takes. */
export interface MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>, "_defaulted"> {}

/** The first argument of `useMutation`: a function returning the options. */
export type UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Accessor<MutationOptions<TData, TError, TVariables, TOnMutateResult>>;

/** `mutate`: runs the mutation; errors go to the result instead of being thrown. */
export type UseMutateFunction<TData = unknown, TError = DefaultError, TVariables = void, TOnMutateResult = unknown> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TOnMutateResult>>
) => void;

/** `mutateAsync`: runs the mutation and returns a promise of its result. */
export type UseMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutateFunction<TData, TError, TVariables, TOnMutateResult>;

/** The result of a mutation observer with `mutate` and `mutateAsync`. */
export type UseBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult> }
> & {
  mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult>;
};

/**
 * What `useMutation` returns: a read-only object whose properties are reactive
 * where they are read. `mutate`, `mutateAsync` and `reset` are stable.
 */
export type UseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult>;
