import { mount, Text } from "nsh";
import { focusManager, QueryClient, QueryClientContext, useQuery, useQueryClient } from "nsh-query";
import { getJson } from "../../support/api";

// QueryClientContext provides the client without mounting it.
const client = new QueryClient();

function Todos() {
  const todos = useQuery(() => ({ queryKey: ["todos"], queryFn: () => getJson<unknown[]>("/todos") }));
  return (
    <>
      <Text>{`same client: ${useQueryClient() === client}`}</Text>
      <Text>{`todos: ${todos.data?.length ?? "none"}`}</Text>
      <Text>{`client mounted: ${focusManager.hasListeners()}`}</Text>
    </>
  );
}

mount(() => QueryClientContext.Provider({ value: client, get children() { return <Todos />; } }));
