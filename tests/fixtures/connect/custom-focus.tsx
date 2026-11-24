import { cleanup, mount } from "nsh";
import { connectNsh, QueryClient } from "nsh-query";
import { TodosStatus } from "../../support/StatusScenario";

// Wired by hand, without QueryClientProvider, with `inactive` counted as unfocused.
const client = new QueryClient();

function App() {
  client.mount();
  cleanup(() => client.unmount());
  connectNsh({ focused: (state) => state === "active" });
  return <TodosStatus client={client} refetchInterval={100} staleTime={Infinity} />;
}

mount(App);
