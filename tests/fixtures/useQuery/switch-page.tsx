import { mount, signal, Text, View } from "nsh";
import { QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import { getJson } from "../../support/api";
import type { Todo } from "../../support/api";
import { Button } from "../../support/Button";

const client = new QueryClient();
const page = signal<"list" | "detail">("detail");

function Detail() {
  const todo = useQuery(() => ({
    queryKey: ["todos", 1],
    queryFn: () => getJson<Todo>("/todos/1"),
    staleTime: 60_000,
  }));
  // Read in the body, so read once: what the first frame shows.
  const firstFrame = todo.data?.title ?? "nothing";
  return (
    <View>
      <Text testID="first-frame">{`first frame: ${firstFrame}`}</Text>
      <Text testID="title">{`title: ${todo.data?.title ?? "none"}`}</Text>
    </View>
  );
}

function App() {
  return (
    <QueryClientProvider client={client}>
      <View>
        <If when={page() === "detail"} else={<Text>list page</Text>}>
          <Detail />
        </If>
        <Button label="List" onPress={() => page.set("list")} />
        <Button label="Detail" onPress={() => page.set("detail")} />
      </View>
    </QueryClientProvider>
  );
}

mount(App);
