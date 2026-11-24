import { mount, signal, Text, View } from "nsh";
import { IsRestoringContext, QueryClient, QueryClientProvider, useIsRestoring, useQuery } from "nsh-query";
import { getJson } from "../../support/api";
import type { Todo } from "../../support/api";
import { Button } from "../../support/Button";

const client = new QueryClient();
const restoring = signal(true);

function Todos() {
  const isRestoring = useIsRestoring();
  const todos = useQuery(() => ({ queryKey: ["todos"], queryFn: () => getJson<Todo[]>("/todos") }));
  return (
    <View>
      <Text testID="restoring">{`restoring: ${isRestoring()}`}</Text>
      <Text testID="fetchStatus">{`fetchStatus: ${todos.fetchStatus}`}</Text>
      <Text testID="todos">{`todos: ${todos.data?.length ?? "none"}`}</Text>
      <Button label="Restored" onPress={() => restoring.set(false)} />
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <IsRestoringContext.Provider value={restoring}>
      <Todos />
    </IsRestoringContext.Provider>
  </QueryClientProvider>
));
