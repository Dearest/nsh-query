import { Text, View } from "nsh";
import type { JSX } from "nsh";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "nsh-query";
import { api, getJson } from "./api";
import { Button } from "./Button";

// A query of /todos and /users, and a mutation posting a todo, for the
// fixtures whose indicators watch them.
function Activity() {
  useQuery(() => ({ queryKey: ["todos"], queryFn: () => getJson<unknown[]>("/todos") }));
  const users = useQuery(() => ({ queryKey: ["users"], queryFn: () => getJson<unknown[]>("/users"), enabled: false }));
  const add = useMutation(() => ({
    mutationKey: ["todos", "add"],
    mutationFn: (title: string) => fetch(`${api}/todos`, { method: "POST", body: JSON.stringify({ title }) }),
  }));
  const rename = useMutation(() => ({
    mutationKey: ["users", "rename"],
    mutationFn: (name: string) => fetch(`${api}/users/1`, { method: "PUT", body: JSON.stringify({ name }) }),
  }));
  return (
    <View>
      <Button label="Load users" onPress={() => void users.refetch()} />
      <Button label="Add" onPress={() => add.mutate("Walk the dog")} />
      <Button label="Rename" onPress={() => rename.mutate("Ada")} />
    </View>
  );
}

export function ActivityScenario(props: { children: JSX.Element }) {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <View>
        <Activity />
        {props.children}
      </View>
    </QueryClientProvider>
  );
}
