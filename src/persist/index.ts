import { cleanup, effect, signal, Storage, untracked } from "nsh";
import type { JSX } from "nsh";
import { createAsyncStoragePersister } from "../../vendor/query-async-storage-persister/index.js";
import type { AsyncPersistRetryer } from "../../vendor/query-async-storage-persister/index.js";
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
  removeOldestQuery,
} from "../../vendor/query-persist-client-core/index.js";
import type {
  MaybePromise,
  PersistedClient,
  Persister,
  PersistQueryClientOptions,
} from "../../vendor/query-persist-client-core/index.js";
import { IsRestoringContext, QueryClientProvider } from "../index";
import type { OmitKeyof, QueryClientProviderProps } from "../index";

export {
  persistQueryClient,
  persistQueryClientRestore,
  persistQueryClientSave,
  persistQueryClientSubscribe,
  removeOldestQuery,
} from "../../vendor/query-persist-client-core/index.js";
export type {
  PersistedClient,
  PersistedQueryClientRestoreOptions,
  PersistedQueryClientSaveOptions,
  Persister,
  PersistQueryClientOptions,
  PersistRetryer,
} from "../../vendor/query-persist-client-core/index.js";
export type { AsyncPersistRetryer } from "../../vendor/query-async-storage-persister/index.js";

export interface NshStoragePersisterOptions {
  /** The `Storage` key the cache is saved under. Default `"nsh-query"`. */
  key?: string;
  /** Saves at most once per this many milliseconds. Default `1000`. */
  throttleTime?: number;
  /**
   * What to do when a save fails, for instance with `ERR_NSH_QUOTA_EXCEEDED`
   * once the 5 MB `Storage` is full: return a smaller client to try again, or
   * `undefined` to give up. Default `removeOldestQuery`.
   */
  retry?: AsyncPersistRetryer;
  /** Turns the client into the saved string. Default `JSON.stringify`. */
  serialize?: (client: PersistedClient) => MaybePromise<string>;
  /** Turns the saved string back into the client. Default `JSON.parse`. */
  deserialize?: (cached: string) => MaybePromise<PersistedClient>;
}

/**
 * A persister that saves the query cache in NSH's `Storage`, the app's
 * key-value storage kept across launches: TanStack's
 * `createAsyncStoragePersister` on `Storage`, with `removeOldestQuery` as the
 * default retry for a full storage.
 *
 * @example
 * ```tsx
 * import { createNshStoragePersister, PersistQueryClientProvider } from "nsh-query/persist";
 *
 * const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 24 * 60 * 60 * 1000 } } });
 * const persister = createNshStoragePersister();
 *
 * mount(() => (
 *   <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
 *     <Todos />
 *   </PersistQueryClientProvider>
 * ));
 * ```
 */
export function createNshStoragePersister(options: NshStoragePersisterOptions = {}): Persister {
  const { key = "nsh-query", throttleTime = 1000, retry = removeOldestQuery, ...rest } = options;
  return createAsyncStoragePersister({ ...rest, storage: Storage, key, throttleTime, retry });
}

export interface PersistQueryClientProviderProps extends QueryClientProviderProps {
  /** The persister and how to restore and save: `maxAge`, `buster`, `dehydrateOptions`, ... */
  persistOptions: OmitKeyof<PersistQueryClientOptions, "queryClient">;
  /** Called once the saved cache is restored (or there was none). */
  onSuccess?: () => Promise<unknown> | unknown;
  /** Called when restoring failed; the saved cache is then removed. */
  onError?: () => Promise<unknown> | unknown;
}

/**
 * `QueryClientProvider` that first restores the saved cache, then saves the
 * cache as it changes. While it restores, `useIsRestoring()` reads `true` and
 * queries neither subscribe nor fetch, so restored data is not fetched again
 * needlessly. Its props are read once, when it is created.
 *
 * Set the queries' `gcTime` to at least `persistOptions.maxAge` (24 hours by
 * default): queries collected from the cache are not saved, and restored
 * queries with a shorter `gcTime` are collected again at once.
 *
 * @example
 * ```tsx
 * mount(() => (
 *   <PersistQueryClientProvider
 *     client={queryClient}
 *     persistOptions={{ persister: createNshStoragePersister(), buster: "v2" }}
 *     onSuccess={() => queryClient.resumePausedMutations()}
 *   >
 *     <Todos />
 *   </PersistQueryClientProvider>
 * ));
 * ```
 */
export function PersistQueryClientProvider(props: PersistQueryClientProviderProps): JSX.Element {
  const client = props.client;
  const options: PersistQueryClientOptions = { ...props.persistOptions, queryClient: client };
  const isRestoring = signal(true);
  let disposed = false;
  cleanup(() => {
    disposed = true;
  });

  persistQueryClientRestore(options)
    .then(() => props.onSuccess?.())
    .catch(() => props.onError?.())
    .finally(() => {
      if (!disposed) isRestoring.set(false);
    });

  effect(() => {
    if (isRestoring()) return;
    untracked(() => cleanup(persistQueryClientSubscribe(options)));
  });

  return QueryClientProvider({
    client,
    get children() {
      return IsRestoringContext.Provider({
        value: isRestoring,
        get children() {
          return props.children;
        },
      });
    },
  });
}
