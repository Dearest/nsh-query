import { cleanup, effect, signal, untracked } from "nsh";
import type { Accessor } from "nsh";
import { notifyManager, replaceEqualDeep } from "./core";
import type { Mutation, MutationCache, MutationFilters, MutationState } from "./core";
import type { QueryClient } from "./QueryClient";
import { useQueryClient } from "./QueryClientProvider";

type MutationTypeFromResult<TResult> = [TResult] extends [
  MutationState<infer TData, infer TError, infer TVariables, infer TOnMutateResult>,
]
  ? Mutation<TData, TError, TVariables, TOnMutateResult>
  : Mutation;

/** What `useMutationState` looks at: which mutations, and what of each. */
export interface MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> = MutationTypeFromResult<TResult>,
> {
  filters?: MutationFilters;
  select?: (mutation: TMutation) => TResult;
}

function getResult<TResult, TMutation extends Mutation<any, any, any, any>>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult, TMutation>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map((mutation): TResult => (options.select ? options.select(mutation as TMutation) : mutation.state) as TResult);
}

/**
 * An accessor of the mutations in the cache that match `filters`: their state,
 * or what `select` takes from each. It follows the cache as mutations start,
 * settle and are removed; unchanged entries keep their identity.
 *
 * @param queryClient - The client to use instead of the provided one.
 *
 * @example
 * ```tsx
 * function PendingTodos() {
 *   const titles = useMutationState(() => ({
 *     filters: { mutationKey: ["todos", "add"], status: "pending" },
 *     select: (mutation) => mutation.state.variables as string,
 *   }));
 *   return <Each of={titles()}>{(title) => <Text>{title()}</Text>}</Each>;
 * }
 * ```
 */
export function useMutationState<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> = MutationTypeFromResult<TResult>,
>(
  options: Accessor<MutationStateOptions<TResult, TMutation>> = () => ({}),
  queryClient?: QueryClient,
): Accessor<Array<TResult>> {
  const mutationCache = useQueryClient(queryClient).getMutationCache();
  const result = signal(untracked(() => getResult(mutationCache, options())));

  effect(() => {
    const current = options();
    untracked(() => {
      const update = () => {
        const next = replaceEqualDeep(result(), getResult(mutationCache, current));
        if (next !== result()) result.set(next);
      };
      update();
      cleanup(mutationCache.subscribe(() => notifyManager.schedule(update)));
    });
  });

  return () => result();
}
