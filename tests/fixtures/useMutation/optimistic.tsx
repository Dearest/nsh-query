import { mount, signal, Text, View } from "nsh";
import { mutationOptions, QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "nsh-query";
import { api, getJson } from "../../support/api";
import { Button } from "../../support/Button";

interface Todo {
  title: string;
}

const client = new QueryClient();
const report = signal("");

const addTodo = mutationOptions({
  mutationKey: ["todos", "add"],
  mutationFn: async (title: string) => {
    const response = await fetch(`${api}/todos`, { method: "POST", body: JSON.stringify({ title }) });
    if (!response.ok) throw new Error(`POST /todos: ${response.status}`);
    return (await response.json()) as Todo;
  },
});

function Todos() {
  const queryClient = useQueryClient();
  const todos = useQuery(() => ({ queryKey: ["todos"], queryFn: () => getJson<Todo[]>("/todos"), staleTime: Infinity }));
  const add = useMutation(() => ({
    ...addTodo,
    onMutate: async (title: string) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old = []) => [...old, { title: `${title} (saving)` }]);
      return { previous };
    },
    onError: (_error, _title, context) => {
      queryClient.setQueryData(["todos"], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  }));
  return (
    <View>
      <Text testID="todos">{`todos: ${todos.data?.map((todo) => todo.title).join(", ") ?? "none"}`}</Text>
      <Text testID="status">{`status: ${add.status}`}</Text>
      <Text testID="variables">{`variables: ${add.variables ?? "none"}`}</Text>
      <Text testID="error">{`error: ${add.error?.message ?? "none"}`}</Text>
      <Button label="Add Feed the cat" onPress={() => add.mutate("Feed the cat")} />
      <Button label="Add Fail" onPress={() => add.mutate("Fail")} />
      <Button label="Reset" onPress={() => add.reset()} />
      <Button
        label="Async"
        onPress={() =>
          void add.mutateAsync("Water the plants").then(
            (todo) => report.set(`resolved: ${todo.title}`),
            (error: Error) => report.set(`rejected: ${error.message}`),
          )
        }
      />
      <Button label="Stable" onPress={() => report.set(`stable: ${add.mutate === add.mutate && add.mutateAsync === add.mutateAsync && add.reset === add.reset}`)} />
      <Text testID="report">{report()}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <Todos />
  </QueryClientProvider>
));
