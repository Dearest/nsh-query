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
  if (typeof options !== "function") {
    throw new Error(
      "Bad argument type. nsh-query takes the options as a function: useQuery(() => ({ queryKey, queryFn })).",
    );
  }
  const client = useQueryClient(queryClient);
  const isRestoring = useIsRestoring();

  const current = computed(() => options());
  const subscribed = computed(() => current().subscribed !== false);

  const defaulted = computed(() => {
    const defaultedOptions = client.defaultQueryOptions(
      current() as QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
    );
    if (isRestoring()) defaultedOptions._optimisticResults = "isRestoring";
    else if (subscribed()) defaultedOptions._optimisticResults = "optimistic";
    else delete defaultedOptions._optimisticResults;
    return defaultedOptions;
  });

  const initialOptions = untracked(defaulted);
  const observer = new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(client, initialOptions);
  const result = signal(observer.getOptimisticResult(initialOptions), { equals: shallowEqual });

  effect(() => {
    if (isRestoring() || !subscribed()) return;
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

  // The observer does not notify about a property nobody has read yet, so the
  // first read of one catches up with whatever changed in the meantime.
  const tracked = new Set<string>();
  return readonlyView(result, (prop) => {
    if (!tracked.has(prop)) {
      tracked.add(prop);
      observer.trackProp(prop as keyof QueryObserverResult);
      if (observer.hasListeners()) untracked(() => result.set(observer.getCurrentResult()));
    }
    if (prop !== "data") return;
    const current = untracked(result);
    if (
      current.isError &&
      !current.isFetching &&
      shouldThrowError(observer.options.throwOnError, [current.error, observer.getCurrentQuery()])
    ) {
      throw current.error;
    }
  });
}

function shallowEqual(a: object, b: object): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key]);
}
