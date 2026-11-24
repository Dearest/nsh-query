import type { DefaultError, WithRequired } from "./core";
import type { MutationOptions } from "./types";

/**
 * Returns `options` as they are, typed: share them between `useMutation` and
 * `useMutationState`'s filters (by `mutationKey`) or the client's
 * `setMutationDefaults`.
 *
 * @example
 * ```tsx
 * const addTodo = mutationOptions({
 *   mutationKey: ["todos", "add"],
 *   mutationFn: (title: string) =>
 *     fetch(`${base}/todos`, { method: "POST", body: JSON.stringify({ title }) }).then((r) => r.json()),
 * });
 *
 * function AddTodo() {
 *   const add = useMutation(() => addTodo);
 *   return <View onPress={() => add.mutate("Walk the dog")} />;
 * }
 * ```
 */
export function mutationOptions<TData = unknown, TError = DefaultError, TVariables = void, TOnMutateResult = unknown>(
  options: WithRequired<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">,
): WithRequired<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
export function mutationOptions<TData = unknown, TError = DefaultError, TVariables = void, TOnMutateResult = unknown>(
  options: Omit<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">,
): Omit<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
export function mutationOptions<TData = unknown, TError = DefaultError, TVariables = void, TOnMutateResult = unknown>(
  options: MutationOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationOptions<TData, TError, TVariables, TOnMutateResult> {
  return options;
}
