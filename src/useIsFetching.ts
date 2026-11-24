import { cleanup, effect, signal, untracked } from "nsh";
import type { Accessor } from "nsh";
import { notifyManager } from "./core";
import type { QueryFilters } from "./core";
import type { QueryClient } from "./QueryClient";
import { useQueryClient } from "./QueryClientProvider";

/**
 * An accessor of how many queries matching `filters` are fetching now, for a
 * global loading indicator.
 *
 * @param filters - A function returning the filters; the signals it reads update them.
 * @param queryClient - The client to use instead of the provided one.
 *
 * @example
 * ```tsx
 * function Spinner() {
 *   const fetching = useIsFetching();
 *   return <If when={fetching() > 0}><Text>Refreshing</Text></If>;
 * }
 * ```
 */
export function useIsFetching(
  filters?: Accessor<Omit<QueryFilters, "fetchStatus">>,
  queryClient?: QueryClient,
): Accessor<number> {
  const client = useQueryClient(queryClient);
  const queryCache = client.getQueryCache();
  const count = signal(untracked(() => client.isFetching(filters?.())));

  effect(() => {
    const current = filters?.();
    untracked(() => {
      const update = () => count.set(client.isFetching(current));
      update();
      cleanup(queryCache.subscribe(notifyManager.batchCalls(update)));
    });
  });

  return () => count();
}
