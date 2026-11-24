import { mutationOptions, useMutation, useMutationState } from "nsh-query";
import type { MutationState, UseMutationResult } from "nsh-query";
import { expectType } from "./helpers";
import type { Equal, Todo } from "./helpers";

declare function addTodo(title: string): Promise<Todo>;

export function mutationCases() {
  const options = mutationOptions({ mutationKey: ["todos", "add"], mutationFn: addTodo });
  expectType<Equal<typeof options.mutationKey, readonly unknown[]>>();

  const add = useMutation(() => options);
  expectType<Equal<typeof add, UseMutationResult<Todo, Error, string, unknown>>>();
  expectType<Equal<typeof add.data, Todo | undefined>>();
  expectType<Equal<typeof add.variables, string | undefined>>();
  add.mutate("Walk the dog");
  const promise = add.mutateAsync("Walk the dog");
  expectType<Equal<typeof promise, Promise<Todo>>>();
  // @ts-expect-error variables are a string
  add.mutate(1);

  // onMutate's result reaches onError as the context.
  useMutation(() => ({
    mutationFn: addTodo,
    onMutate: () => ({ previous: [] as Todo[] }),
    onError: (_error, _variables, context) => {
      expectType<Equal<typeof context, { previous: Todo[] } | undefined>>();
    },
  }));

  const states = useMutationState(() => ({ filters: { mutationKey: ["todos", "add"] } }));
  expectType<Equal<ReturnType<typeof states>, MutationState<unknown, Error, unknown, unknown>[]>>();
  const titles = useMutationState(() => ({ select: (mutation) => mutation.state.variables as string }));
  expectType<Equal<ReturnType<typeof titles>, string[]>>();

  // @ts-expect-error onSuccess receives what mutationFn returns
  mutationOptions({ mutationKey: ["todos"], mutationFn: (title: string) => title.length, onSuccess: (data: string) => data });
}
