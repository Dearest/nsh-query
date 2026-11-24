import { effect, mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import { getJson } from "../../support/api";
import type { Todo } from "../../support/api";
import { Button } from "../../support/Button";

const client = new QueryClient();
let runs = 0;
const shownRuns = signal(0);

function Todos() {
  const options = () => ({ queryKey: ["todos", 1], queryFn: () => getJson<Todo>("/todos/1") });
  const first = useQuery(options);
  const second = useQuery(options);
  // Two fields of one observer and one of another: one notification of the
  // query updates all three.
  effect(() => {
    void first.data;
    void first.dataUpdatedAt;
    void second.data;
    runs += 1;
  });
  return (
    <View>
      <Text testID="title">{`title: ${first.data?.title ?? "none"}`}</Text>
      <Button label="Refetch" onPress={() => void client.refetchQueries({ queryKey: ["todos", 1] })} />
      <Button label="Count" onPress={() => shownRuns.set(runs)} />
      <Text testID="runs">{`runs: ${shownRuns()}`}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <Todos />
  </QueryClientProvider>
));
