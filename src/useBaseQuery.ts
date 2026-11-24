import { cleanup, computed, effect, signal, untracked } from "nsh";
import type { Accessor } from "nsh";
import { notifyManager, shouldThrowError } from "./core";
import type { QueryKey, QueryObserver, QueryObserverOptions, QueryObserverResult } from "./core";
import { useIsRestoring } from "./isRestoring";
import type { QueryClient } from "./QueryClient";
import { useQueryClient } from "./QueryClientProvider";
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

  const read = (prop: PropertyKey): unknown => {
    const current = result();
    if (
      current.isError &&
      !current.isFetching &&
      shouldThrowError(observer.options.throwOnError, [current.error, observer.getCurrentQuery()])
    ) {
      throw current.error;
    }
    return (current as unknown as Record<PropertyKey, unknown>)[prop];
  };

  return new Proxy({} as QueryObserverResult<TData, TError>, {
    get(_, prop) {
      if (typeof prop === "string") observer.trackProp(prop as keyof QueryObserverResult);
      return read(prop);
    },
    has(_, prop) {
      return prop in result();
    },
    ownKeys() {
      return Reflect.ownKeys(result());
    },
    getOwnPropertyDescriptor(_, prop) {
      if (!(prop in result())) return undefined;
      if (typeof prop === "string") observer.trackProp(prop as keyof QueryObserverResult);
      return { configurable: true, enumerable: true, writable: false, value: read(prop) };
    },
  });
}
