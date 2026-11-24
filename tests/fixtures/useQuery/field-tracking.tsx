import { mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import { getJson } from "../../support/api";
import type { Todo } from "../../support/api";
import { Button } from "../../support/Button";

const client = new QueryClient();
let runs = 0;
const shownRuns = signal(0);

function Title() {
  const todo = useQuery(() => ({ queryKey: ["todos", 1], queryFn: () => getJson<Todo>("/todos/1") }));
  const title = () => {
    runs += 1;
    return `title: ${todo.data?.title ?? "none"}`;
  };
  return (
    <View>
      <Text testID="title">{title()}</Text>
      <Button label="Refetch" onPress={() => void client.refetchQueries({ queryKey: ["todos", 1] })} />
      <Button label="Count" onPress={() => shownRuns.set(runs)} />
      <Text testID="runs">{`runs: ${shownRuns()}`}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <Title />
  </QueryClientProvider>
));
