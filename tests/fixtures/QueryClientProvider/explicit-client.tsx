import { mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "nsh-query";
import { getJson } from "../../support/api";
import { Button } from "../../support/Button";

const provided = new QueryClient();
const explicit = new QueryClient();
const report = signal("");

function Todos() {
  const fromContext = useQueryClient();
  const fromArgument = useQueryClient(explicit);
  const todos = useQuery(() => ({ queryKey: ["todos"], queryFn: () => getJson<unknown[]>("/todos") }), explicit);
  const cached = (client: QueryClient) => client.getQueryData(["todos"]) !== undefined;
  return (
    <View>
      <Text>{`context client: ${fromContext === provided}`}</Text>
      <Text>{`argument client: ${fromArgument === explicit}`}</Text>
      <Text>{`todos: ${todos.data?.length ?? "none"}`}</Text>
      <Button label="Report" onPress={() => report.set(`explicit: ${cached(explicit)}, provided: ${cached(provided)}`)} />
      <Text>{report()}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={provided}>
    <Todos />
  </QueryClientProvider>
));
