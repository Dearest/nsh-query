import { mount } from "nsh";
import type { PersistedClient } from "nsh-query/persist";
import { PersistScenario, Todos } from "../../support/PersistScenario";

// Restoring takes 100 ms, so a test can look at the app while it restores.
const deserialize = (cached: string) =>
  new Promise<PersistedClient>((resolve) => setTimeout(() => resolve(JSON.parse(cached) as PersistedClient), 100));

mount(() => (
  <PersistScenario persister={{ deserialize }}>
    <Todos staleTime={0} />
  </PersistScenario>
));
