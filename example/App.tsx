import { mount, signal, View } from "nsh";
import { QueryClient } from "nsh-query";
import { createNshStoragePersister, PersistQueryClientProvider } from "nsh-query/persist";
import { Button } from "./screens/Button";
import { Feed } from "./screens/Feed";
import { TodoDetail } from "./screens/TodoDetail";
import { TodoList } from "./screens/TodoList";

const day = 24 * 60 * 60 * 1000;

// Kept for a day in memory and in Storage, refetched in the background once
// older than 30 seconds.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: day } },
});
const persister = createNshStoragePersister({ key: "nsh-query-example" });

type Screen = { name: "todos" } | { name: "todo"; id: number } | { name: "feed" };

function App() {
  const screen = signal<Screen>({ name: "todos" });
  const detailId = () => {
    const current = screen();
    return current.name === "todo" ? current.id : undefined;
  };
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: day }}>
      <View class="flex-1 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <View class="flex-row gap-2 p-4">
          <Button label="Todos" onPress={() => screen.set({ name: "todos" })} />
          <Button label="Feed" onPress={() => screen.set({ name: "feed" })} />
        </View>
        <If when={screen().name === "todos"}>
          <TodoList onOpen={(id) => screen.set({ name: "todo", id })} />
        </If>
        <If when={detailId()}>
          {(id) => <TodoDetail id={id()} onBack={() => screen.set({ name: "todos" })} />}
        </If>
        <If when={screen().name === "feed"}>
          <Feed />
        </If>
      </View>
    </PersistQueryClientProvider>
  );
}

mount(App);
