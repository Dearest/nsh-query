import { mount, signal, Text, View } from "nsh";
import { QueryClient, useQuery } from "nsh-query";
import { createNshStoragePersister, PersistQueryClientProvider } from "nsh-query/persist";
import { getJson } from "../../support/api";
import { Button } from "../../support/Button";

// Three large queries, loaded one after the other (oldest first), into a
// storage that has room for two.
const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, staleTime: Infinity } } });
const shown = signal(0);

function Post(props: { id: number }) {
  const post = useQuery(() => ({ queryKey: ["posts", props.id], queryFn: () => getJson<{ body: string }>(`/posts/${props.id}`) }));
  return <Text>{`post ${props.id}: ${post.data ? post.data.body.length : "none"}`}</Text>;
}

mount(() => (
  <PersistQueryClientProvider client={client} persistOptions={{ persister: createNshStoragePersister({ throttleTime: 100 }) }}>
    <View>
      <Each of={Array.from({ length: shown() }, (_, index) => index + 1)}>{(id) => <Post id={id()} />}</Each>
      <Button label="Next" onPress={() => shown.update((n) => n + 1)} />
    </View>
  </PersistQueryClientProvider>
));
