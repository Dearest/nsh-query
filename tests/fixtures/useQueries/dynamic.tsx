import { mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQueries } from "nsh-query";
import { getJson } from "../../support/api";
import { Button } from "../../support/Button";

interface User {
  id: number;
  name: string;
}

const client = new QueryClient();
const ids = signal([1, 2]);
let combines = 0;

const userQuery = (id: number) => ({
  queryKey: ["users", id],
  queryFn: () => getJson<User>(`/users/${id}`),
  staleTime: Infinity,
});

function Users() {
  const combined = useQueries(() => ({
    queries: ids().map(userQuery),
    combine: (results) => {
      combines += 1;
      return {
        names: results.map((result) => result.data?.name ?? "...").join(","),
        pending: results.some((result) => result.isPending),
      };
    },
  }));
  const results = useQueries(() => ({ queries: ids().map(userQuery) }));
  return (
    <View>
      <Text testID="names">{`names: ${combined.names}`}</Text>
      <Text testID="pending">{`pending: ${combined.pending}`}</Text>
      <Text testID="count">{`count: ${results.length}`}</Text>
      <Text testID="statuses">{`statuses: ${results.map((result) => result.status).join(",")}`}</Text>
      <Text testID="is-array">{`array: ${Array.isArray(results)}`}</Text>
      <Button label="Add" onPress={() => ids.update((list) => [...list, list.length + 1])} />
      <Button label="Remove" onPress={() => ids.update((list) => list.slice(0, -1))} />
      <Button label="Combines" onPress={() => combinesShown.set(combines)} />
      <Text>{`combines: ${combinesShown()}`}</Text>
    </View>
  );
}

const combinesShown = signal(0);

mount(() => (
  <QueryClientProvider client={client}>
    <Users />
  </QueryClientProvider>
));
