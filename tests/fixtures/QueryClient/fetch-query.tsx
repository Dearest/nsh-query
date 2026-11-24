import { mount, signal, Text, View } from "nsh";
import { QueryClient } from "nsh-query";

const client = new QueryClient();

function App() {
  const title = signal("pending");
  client
    .fetchQuery({
      queryKey: ["todos", 1],
      queryFn: () => fetch("https://api.test/todos/1").then((r) => r.json() as Promise<{ title: string }>),
    })
    .then(
      (todo) => title.set(todo.title),
      (error: unknown) => title.set(`error: ${String(error)}`),
    );
  return (
    <View>
      <Text testID="title">{title()}</Text>
    </View>
  );
}

mount(App);
