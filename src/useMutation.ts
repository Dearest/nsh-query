import { cleanup, computed, effect, signal, untracked } from "nsh";
import { MutationObserver, noop, notifyManager, shouldThrowError } from "./core";
import type { DefaultError } from "./core";
import type { QueryClient } from "./QueryClient";
import { useQueryClient } from "./QueryClientProvider";
import { readonlyView } from "./readonlyView";
import type { UseMutateFunction, UseMutationOptions, UseMutationResult } from "./types";

/**
 * Creates a mutation: a function that changes data on the server, with its
 * state. `options` is a function; the signals it reads update the options.
 *
 * The result is read by property (`add.isPending`, `add.error`), reactively
 * where it is read. `mutate` (errors go to the result), `mutateAsync` (returns
 * a promise) and `reset` are stable functions. Call it in a component body.
 *
 * @param queryClient - The client to use instead of the provided one.
 *
 * @example
 * ```tsx
 * function AddTodo() {
 *   const queryClient = useQueryClient();
 *   const add = useMutation(() => ({
 *     mutationFn: (title: string) =>
 *       fetch(`${base}/todos`, { method: "POST", body: JSON.stringify({ title }) }).then((r) => r.json()),
 *     onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
 *   }));
 *   return (
 *     <View onPress={() => add.mutate("Walk the dog")}>
 *       <Text>{add.isPending ? "Saving" : "Add"}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMutation<TData = unknown, TError = DefaultError, TVariables = void, TOnMutateResult = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
  const client = useQueryClient(queryClient);
  const currentOptions = computed(() => options());
  const initialOptions = untracked(currentOptions);
  const observer = new MutationObserver<TData, TError, TVariables, TOnMutateResult>(client, initialOptions);

  effect(() => {
    const next = currentOptions();
    if (next === initialOptions) return;
    untracked(() => observer.setOptions(next));
  });

  const result = signal(observer.getCurrentResult(), { equals: false });
  cleanup(observer.subscribe(notifyManager.batchCalls((next) => result.set(next))));

  const mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult> = (...args) => {
    observer.mutate(args[0] as TVariables, args[1]).catch(noop);
  };

  const view = computed(() => {
    const current = result();
    if (current.error && shouldThrowError(observer.options.throwOnError, [current.error])) {
      throw current.error;
    }
    return { ...current, mutate, mutateAsync: current.mutate };
  });

  return readonlyView(view);
}
