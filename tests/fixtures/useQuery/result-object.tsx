import { mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import { getJson } from "../../support/api";
import type { Todo } from "../../support/api";
import { Button } from "../../support/Button";

const client = new QueryClient();
const report = signal("");

function Todo() {
  const todo = useQuery(() => ({ queryKey: ["todos", 1], queryFn: () => getJson<Todo>("/todos/1") }));
  const describe = () => {
    const copy = { ...todo };
    return [
      `in: ${"data" in todo}, ${"refetch" in todo}, ${"nothing" in todo}`,
      `keys: ${Object.keys(todo).includes("isFetching")}`,
      `spread: ${copy.data?.title}, ${copy.status}`,
      `refetch stable: ${todo.refetch === todo.refetch}`,
    ].join(" | ");
  };
  return (
    <View>
      <Text testID="title">{`title: ${todo.data?.title ?? "none"}`}</Text>
      <Button label="Describe" onPress={() => report.set(describe())} />
      <Text testID="report">{report()}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <Todo />
  </QueryClientProvider>
));
