import { QueryClient } from "nsh-query";
import { createNshStoragePersister, PersistQueryClientProvider, removeOldestQuery } from "nsh-query/persist";
import type { Persister, PersistQueryClientProviderProps } from "nsh-query/persist";
import { expectType } from "./helpers";
import type { Equal } from "./helpers";

export function persistCases(client: QueryClient) {
  const persister = createNshStoragePersister({ key: "todos", throttleTime: 500, retry: removeOldestQuery });
  expectType<Equal<typeof persister, Persister>>();
  createNshStoragePersister();

  const props: PersistQueryClientProviderProps = { client, persistOptions: { persister, maxAge: 1000, buster: "v2" } };
  PersistQueryClientProvider(props);

  // @ts-expect-error persistOptions is required
  PersistQueryClientProvider({ client });

  // @ts-expect-error the client is the provider's own prop, not a persist option
  PersistQueryClientProvider({ client, persistOptions: { persister, queryClient: client } });

  // @ts-expect-error the storage is NSH's Storage, not an option
  createNshStoragePersister({ storage: null });
}
