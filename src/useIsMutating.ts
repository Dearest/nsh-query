import { cleanup, effect, signal, untracked } from "nsh";
import type { Accessor } from "nsh";
import { notifyManager } from "./core";
import type { MutationFilters } from "./core";
import type { QueryClient } from "./QueryClient";
import { useQueryClient } from "./QueryClientProvider";

/**
 * An accessor of how many mutations matching `filters` are running now.
 *
 * @param filters - A function returning the filters; the signals it reads update them.
 * @param queryClient - The client to use instead of the provided one.
 *
 * @example
 * ```tsx
 * function SavingBadge() {
 *   const saving = useIsMutating(() => ({ mutationKey: ["todos"] }));
 *   return <If when={saving() > 0}><Text>Saving</Text></If>;
 * }
 * ```
 */
export function useIsMutating(
  filters?: Accessor<Omit<MutationFilters, "status">>,
  queryClient?: QueryClient,
): Accessor<number> {
  const client = useQueryClient(queryClient);
  const mutationCache = client.getMutationCache();
  const count = signal(untracked(() => client.isMutating(filters?.())));

  effect(() => {
    const current = filters?.();
    untracked(() => {
      const update = () => count.set(client.isMutating(current));
      update();
      cleanup(mutationCache.subscribe(notifyManager.batchCalls(update)));
    });
  });

  return () => count();
}
