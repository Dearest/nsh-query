import { ErrorBoundary, mount, Text } from "nsh";
import { useQuery } from "nsh-query";
import { getJson } from "../../support/api";

function Todos() {
  const todos = useQuery(() => ({ queryKey: ["todos"], queryFn: () => getJson<unknown[]>("/todos") }));
  return <Text>{`todos: ${todos.data?.length ?? "none"}`}</Text>;
}

mount(() => (
  <ErrorBoundary fallback={(error) => <Text testID="error">{error instanceof Error ? error.message : String(error)}</Text>}>
    <Todos />
  </ErrorBoundary>
));
