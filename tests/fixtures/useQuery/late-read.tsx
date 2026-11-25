import { effect, mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import { getJson } from "../../support/api";
import type { Todo } from "../../support/api";
import { Button } from "../../support/Button";

const client = new QueryClient();
const key = ["todos", 1];
const detail = signal(false);
const indicator = signal(false);
const handled = signal("handler: not read");
let titleRuns = 0;
const shownRuns = signal(0);

// A property first read after it changed: `data` in a branch that opens once
// the data is there, `isFetching` in one that opens during a refetch, and
// `status` in an event handler.
function Todos() {
  const todo = useQuery(() => ({ queryKey: key, queryFn: () => getJson<Todo>("/todos/1"), staleTime: Infinity }));
  effect(() => {
    if (todo.error) console.error(todo.error);
  });
  const title = () => {
    titleRuns += 1;
    return `title: ${todo.data?.title ?? "none"}`;
  };
  return (
    <View>
      <Button label="Detail" onPress={() => detail.set(true)} />
      <Button label="Indicator" onPress={() => indicator.set(true)} />
      <Button label="Refetch" onPress={() => void client.refetchQueries({ queryKey: key })} />
      <Button label="Handler" onPress={() => handled.set(`handler: ${todo.status}`)} />
      <Button label="Count" onPress={() => shownRuns.set(titleRuns)} />
      {detail() ? <Text>{title()}</Text> : null}
      {indicator() ? <Text>{`fetching: ${todo.isFetching}`}</Text> : null}
      <Text>{handled()}</Text>
      <Text>{`runs: ${shownRuns()}`}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <Todos />
  </QueryClientProvider>
));
