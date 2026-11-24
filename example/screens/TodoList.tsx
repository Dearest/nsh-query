import { Text, View } from "nsh";
import { useMutation, useQuery, useQueryClient } from "nsh-query";
import type { Todo } from "../api";
import { addTodoMutation, onlineQuery, todosQuery } from "../queries";
import { Button } from "./Button";

let added = 0;

export function TodoList(props: { onOpen: (id: number) => void }) {
  const queryClient = useQueryClient();
  const todos = useQuery(() => todosQuery);
  const online = useQuery(() => onlineQuery);

  // Optimistic update: the new todo shows at once, marked as saving; a failure
  // puts the list back; either way the list is fetched again.
  const add = useMutation(() => ({
    ...addTodoMutation,
    onMutate: async (title: string) => {
      await queryClient.cancelQueries({ queryKey: todosQuery.queryKey });
      const previous = queryClient.getQueryData(todosQuery.queryKey);
      queryClient.setQueryData(todosQuery.queryKey, (old: Todo[] = []) => [
        ...old,
        { id: -1, title: `${title} (saving)`, notes: "" },
      ]);
      return { previous };
    },
    onError: (_error, _title, context) => queryClient.setQueryData(todosQuery.queryKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosQuery.queryKey }),
  }));

  return (
    <View class="flex-1 gap-3 p-4">
      <Text class="text-sm text-muted-foreground">{`Online now: ${online.data ?? "…"}`}</Text>
      <If when={todos.isPending}>
        <Text>Loading todos</Text>
      </If>
      <Each of={todos.data} key={(todo) => todo.id}>
        {(todo) => (
          <View role="button" onPress={() => todo().id > 0 && props.onOpen(todo().id)} class="rounded-md bg-card p-3">
            <Text class="text-lg text-card-foreground">{todo().title}</Text>
          </View>
        )}
      </Each>
      <Button label="Add todo" disabled={add.isPending} onPress={() => add.mutate(`New todo ${++added}`)} />
      <If when={todos.isFetching && !todos.isPending}>
        <Text class="text-sm text-muted-foreground">Refreshing</Text>
      </If>
    </View>
  );
}
