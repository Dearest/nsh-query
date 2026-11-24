import { cleanup, computed, effect, signal, untracked } from "nsh";
import type { Accessor } from "nsh";
import { notifyManager, shouldThrowError } from "./core";
import type { QueryKey, QueryObserver, QueryObserverOptions, QueryObserverResult } from "./core";
import { useIsRestoring } from "./isRestoring";
import type { QueryClient } from "./QueryClient";
import { useQueryClient } from "./QueryClientProvider";
import { readonlyView } from "./readonlyView";
import type { UseBaseQueryOptions } from "./types";

/**
 * The adapter behind `useQuery` and `useInfiniteQuery`, after react-query's:
 * take the optimistic result, subscribe, and let the observer track which
 * result properties are read so that it notifies only when one of them changes.
 */
export function useBaseQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(
  options: Accessor<UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>>,
  Observer: typeof QueryObserver,
  queryClient?: QueryClient,
): QueryObserverResult<TData, TError> {
  const client = useQueryClient(queryClient);
  const isRestoring = useIsRestoring();

  const defaulted = computed(() => {
    const defaultedOptions = client.defaultQueryOptions(
      options() as QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
    );
    defaultedOptions._optimisticResults = isRestoring() ? "isRestoring" : "optimistic";
    return defaultedOptions;
  });

  const initialOptions = untracked(defaulted);
  const observer = new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(client, initialOptions);
  const result = signal(observer.getOptimisticResult(initialOptions), { equals: false });

  effect(() => {
    if (isRestoring()) return;
    untracked(() => {
      cleanup(observer.subscribe(notifyManager.batchCalls((next) => result.set(next))));
      observer.updateResult();
    });
  });

  effect(() => {
    const next = defaulted();
    if (next === initialOptions) return;
    untracked(() => {
      observer.setOptions(next);
      result.set(observer.getOptimisticResult(next));
    });
  });

  return readonlyView(
    () => {
      const current = result();
      if (
        current.isError &&
        !current.isFetching &&
        shouldThrowError(observer.options.throwOnError, [current.error, observer.getCurrentQuery()])
      ) {
        throw current.error;
      }
      return current;
    },
    (prop) => observer.trackProp(prop as keyof QueryObserverResult),
  );
}
