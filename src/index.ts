import { batch } from "nsh";
import { environmentManager, focusManager, notifyManager, onlineManager } from "./core";

// query-core treats a runtime without `window` as a server: no refetch
// intervals, no stale timers, no retries. An NSH app is a client.
environmentManager.setIsServer(() => false);
// NSH applies each signal write at once; batch the writes of one notification.
notifyManager.setBatchNotifyFunction(batch);
// Focus and connectivity come from NSH's platform signals (connectNsh), not
// from `window` events, which exist only on `--target web`.
focusManager.setEventListener(() => () => {});
onlineManager.setEventListener(() => () => {});

export * from "./core";
export { QueryClient } from "./QueryClient";
export { QueryClientContext, QueryClientProvider, useQueryClient } from "./QueryClientProvider";
export type { QueryClientProviderProps } from "./QueryClientProvider";
export { connectNsh } from "./connect";
export type { ConnectNshOptions, LifecycleState } from "./connect";
export { IsRestoringContext, useIsRestoring } from "./isRestoring";
export { useQuery } from "./useQuery";
export { useInfiniteQuery } from "./useInfiniteQuery";
export { useQueries } from "./useQueries";
export type { QueriesOptions, QueriesResults } from "./useQueries";
export { useMutation } from "./useMutation";
export { useIsFetching } from "./useIsFetching";
export { useIsMutating } from "./useIsMutating";
export { useMutationState } from "./useMutationState";
export type { MutationStateOptions } from "./useMutationState";
export { queryOptions } from "./queryOptions";
export type { DefinedInitialDataOptions, UndefinedInitialDataOptions } from "./queryOptions";
export { infiniteQueryOptions } from "./infiniteQueryOptions";
export type { DefinedInitialDataInfiniteOptions, UndefinedInitialDataInfiniteOptions } from "./infiniteQueryOptions";
export { mutationOptions } from "./mutationOptions";
export type {
  DefinedUseBaseQueryResult,
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  InfiniteQueryOptions,
  MutationOptions,
  QueryOptions,
  UseBaseMutationResult,
  UseBaseQueryOptions,
  UseBaseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutateAsyncFunction,
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "./types";
