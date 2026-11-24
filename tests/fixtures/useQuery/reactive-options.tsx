import { keepPreviousData, QueryClient, QueryClientProvider, useQuery } from "nsh-query";
import { mount, signal, Text, View } from "nsh";
import { getJson } from "../../support/api";
import type { Todo } from "../../support/api";
import { Button } from "../../support/Button";

const client = new QueryClient();
const id = signal(1);
let bodies = 0;

function Todo(props: { id: number }) {
  bodies += 1;
  const kept = useQuery(() => ({
    queryKey: ["todos", props.id],
    queryFn: () => getJson<Todo>(`/todos/${props.id}`),
    placeholderData: keepPreviousData,
  }));
  const plain = useQuery(() => ({
    queryKey: ["todos", props.id],
    queryFn: () => getJson<Todo>(`/todos/${props.id}`),
  }));
  return (
    <View>
      <Text testID="kept">{`kept: ${kept.data?.title ?? "none"}`}</Text>
      <Text testID="placeholder">{`placeholder: ${kept.isPlaceholderData}`}</Text>
      <Text testID="plain">{`plain: ${plain.data?.title ?? "none"}`}</Text>
      <Text testID="bodies">{`bodies: ${bodies}`}</Text>
    </View>
  );
}

mount(() => (
  <QueryClientProvider client={client}>
    <View>
      <Todo id={id()} />
      <Button label="Next" onPress={() => id.update((n) => n + 1)} />
    </View>
  </QueryClientProvider>
));
