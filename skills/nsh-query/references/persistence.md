# Persisting the cache

```tsx
import { createNshStoragePersister, PersistQueryClientProvider } from "nsh-query/persist";

const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 24 * 60 * 60 * 1000 } } });

mount(() => (
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: createNshStoragePersister() }}>
    <App />
  </PersistQueryClientProvider>
));
```

`gcTime` must be at least `maxAge` (24 h by default). `useIsRestoring()` reads `true` while the cache is restored.

`Storage` holds 5 MB. When a save does not fit, the persister drops the oldest queries and tries again (`retry: removeOldestQuery`, the default of `createNshStoragePersister`).

Restoring is asynchronous (`Storage` only reads that way): for a moment after launch the cache is empty and `useIsRestoring()` is `true`. Queries do not fetch during it; afterwards restored data shows, and stale data refetches.

Change `persistOptions.buster` (a string, for instance the app's version) to discard caches saved by an older build.
