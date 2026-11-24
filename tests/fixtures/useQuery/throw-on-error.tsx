import { ErrorBoundary, mount, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import { getJson } from "../../support/api";
import type { Todo } from "../../support/api";

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Thrown() {
  const todo = useQuery(() => ({ queryKey: ["todos", 1], queryFn: () => getJson<Todo>("/todos/1"), throwOnError: true }));
  return <Text testID="thrown">{`thrown: ${todo.data?.title ?? "none"}`}</Text>;
}

function Kept() {
  const todo = useQuery(() => ({ queryKey: ["todos", 2], queryFn: () => getJson<Todo>("/todos/2") }));
  return <Text testID="kept">{`kept: ${todo.status}, ${todo.error?.message ?? "no error"}`}</Text>;
}

mount(() => (
  <QueryClientProvider client={client}>
    <View>
      <ErrorBoundary fallback={(error) => <Text testID="boundary">{`boundary: ${error instanceof Error ? error.message : String(error)}`}</Text>}>
        <Thrown />
      </ErrorBoundary>
      <ErrorBoundary fallback={<Text>kept boundary</Text>}>
        <Kept />
      </ErrorBoundary>
    </View>
  </QueryClientProvider>
));
