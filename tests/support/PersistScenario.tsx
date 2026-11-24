import { signal, Text, View } from "nsh";
import type { JSX } from "nsh";
import { QueryClient, useIsRestoring, useQuery } from "nsh-query";
import { createNshStoragePersister, PersistQueryClientProvider } from "nsh-query/persist";
import type { NshStoragePersisterOptions } from "nsh-query/persist";
import { getJson } from "./api";
import type { Todo } from "./api";

const day = 24 * 60 * 60 * 1000;

export function Todos(props: { staleTime?: number }) {
  const isRestoring = useIsRestoring();
  const todos = useQuery(() => ({
    queryKey: ["todos"],
    queryFn: () => getJson<Todo[]>("/todos"),
    staleTime: props.staleTime ?? Infinity,
  }));
  return (
    <View>
      <Text testID="restoring">{`restoring: ${isRestoring()}`}</Text>
      <Text testID="todos">{`todos: ${todos.data?.map((todo) => todo.title).join(", ") ?? "none"}`}</Text>
      <Text testID="fetchStatus">{`fetchStatus: ${todos.fetchStatus}`}</Text>
    </View>
  );
}

// A persisted client. `buster` and the persister options vary by fixture.
export function PersistScenario(props: {
  buster?: string;
  persister?: NshStoragePersisterOptions;
  children?: JSX.Element;
}) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: day } } });
  const outcome = signal("restoring");
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister: createNshStoragePersister(props.persister), buster: props.buster ?? "v1" }}
      onSuccess={() => outcome.set("restored")}
      onError={() => outcome.set("restore failed")}
    >
      <View>
        <Text testID="outcome">{`outcome: ${outcome()}`}</Text>
        {props.children}
      </View>
    </PersistQueryClientProvider>
  );
}
