import { effect, mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQueries } from "nsh-query";
import { getJson } from "../../support/api";
import { Button } from "../../support/Button";

interface User {
  id: number;
  name: string;
}

const client = new QueryClient();
const ids = signal([1, 2]);
const detail = signal(false);
const indicator = signal(false);
const handled = signal("handler: not read");

// A property first read after it changed: `data` in a branch that opens once
// the data is there, `isFetching` in one that opens during a refetch, and
// `status` in an event handler.
function Users() {
  const users = useQueries(() => ({
    queries: ids().map((id) => ({
      queryKey: ["users", id],
      queryFn: () => getJson<User>(`/users/${id}`),
      staleTime: Infinity,
    })),
  }));
  effect(() => {
    for (const user of users) if (user.error) console.error(user.error);
  });
  return (
    <View>
      <Button label="Detail" onPress={() => detail.set(true)} />
      <Button label="Indicator" onPress={() => indicator.set(true)} />
      <Button label="Add" onPress={() => ids.update((list) => [...list, list.length + 1])} />
      <Button label="Refetch" onPress={() => void client.refetchQueries({ queryKey: ["users", 1] })} />
      <Button label="Handler" onPress={() => handled.set(`handler: ${users.map((user) => user.status).join(",")}`)} />
      {detail() ? <Text>{`names: ${users.map((user) => user.data?.name ?? "...").join(",")}`}</Text> : null}
      {indicator() ? <Text>{`fetching: ${users.map((user) => user.isFetching).join(",")}`}</Text> : null}
      <Text>{handled()}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <Users />
  </QueryClientProvider>
));
