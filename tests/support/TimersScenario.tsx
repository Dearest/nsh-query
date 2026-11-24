import { Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import { getJson } from "./api";
import type { Todo } from "./api";

// A query polling every 50 ms and one going stale after 50 ms: both need the
// timers query-core schedules only when it does not take the app for a server.
function Timers() {
  const polled = useQuery(() => ({
    queryKey: ["todos"],
    queryFn: () => getJson<Todo[]>("/todos"),
    refetchInterval: 50,
  }));
  const user = useQuery(() => ({
    queryKey: ["users", 1],
    queryFn: () => getJson<{ name: string }>("/users/1"),
    staleTime: 50,
  }));
  return (
    <View>
      <Text testID="todos">{`todos: ${polled.data?.length ?? "none"}`}</Text>
      <Text testID="user">{`user: ${user.data?.name ?? "none"}`}</Text>
      <Text testID="stale">{`stale: ${user.isStale}`}</Text>
    </View>
  );
}

export function TimersScenario() {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <Timers />
    </QueryClientProvider>
  );
}
