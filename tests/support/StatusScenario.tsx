import { Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import type { QueryClientConfig } from "nsh-query";
import { getJson } from "./api";
import type { Todo } from "./api";
import { Button } from "./Button";

// One query of /todos showing what the platform tests look at.
export function TodosStatus(props: { staleTime?: number; refetchInterval?: number; client?: QueryClient }) {
  const todos = useQuery(() => ({
    queryKey: ["todos"],
    queryFn: ({ signal }) => getJson<Todo[]>("/todos", { signal }),
    staleTime: props.staleTime ?? 0,
    refetchInterval: props.refetchInterval ?? false,
  }), props.client);
  return (
    <View>
      <Text testID="todos">{`todos: ${todos.data?.length ?? "none"}`}</Text>
      <Text testID="fetchStatus">{`fetchStatus: ${todos.fetchStatus}`}</Text>
      <Button label="Refetch" onPress={() => void todos.refetch()} />
    </View>
  );
}

export function StatusScenario(props: { staleTime?: number; refetchInterval?: number; config?: QueryClientConfig }) {
  const client = new QueryClient(props.config);
  return (
    <QueryClientProvider client={client}>
      <TodosStatus {...props} />
    </QueryClientProvider>
  );
}
