import { mount, signal, Text } from "nsh";
import { QueryClient } from "nsh-query";
import {
  createNshStoragePersister,
  persistQueryClient,
  persistQueryClientRestore,
  persistQueryClientSave,
  persistQueryClientSubscribe,
  removeOldestQuery,
} from "nsh-query/persist";

// The persistence functions re-exported from TanStack, used without the provider.
const persister = createNshStoragePersister({ key: "manual", throttleTime: 10, retry: removeOldestQuery });
const status = signal("starting");

async function run() {
  const client = new QueryClient();
  await persistQueryClientRestore({ queryClient: client, persister });
  const restored = client.getQueryData<string[]>(["todos"]);

  client.setQueryData(["todos"], ["Walk the dog"]);
  await persistQueryClientSave({ queryClient: client, persister });
  const unsubscribe = persistQueryClientSubscribe({ queryClient: client, persister });
  client.setQueryData(["users"], ["Ada"]);
  await new Promise((resolve) => setTimeout(resolve, 50));
  unsubscribe();

  const other = new QueryClient();
  const [stop, done] = persistQueryClient({ queryClient: other, persister });
  await done;
  stop();

  status.set(`restored first: ${restored?.join() ?? "nothing"}; other client: ${other.getQueryData<string[]>(["users"])?.join()}`);
}

void run();

mount(() => <Text>{status()}</Text>);
