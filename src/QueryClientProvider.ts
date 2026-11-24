import { cleanup, context } from "nsh";
import type { JSX } from "nsh";
import { connectNsh } from "./connect";
import type { QueryClient } from "./QueryClient";

/**
 * The context `useQueryClient` reads. `QueryClientProvider` is the usual way to
 * set it; providing it directly skips `client.mount()` and `connectNsh()`.
 */
export const QueryClientContext = context<QueryClient | undefined>(undefined);

/**
 * The `QueryClient` to use: `queryClient` when given, else the one the nearest
 * `QueryClientProvider` provides. Call it in a component body.
 *
 * @throws When no `queryClient` is given and no `QueryClientProvider` is above.
 *
 * @example
 * ```tsx
 * function AddTodo() {
 *   const queryClient = useQueryClient();
 *   return <View onPress={() => queryClient.invalidateQueries({ queryKey: ["todos"] })} />;
 * }
 * ```
 */
export function useQueryClient(queryClient?: QueryClient): QueryClient {
  if (queryClient) return queryClient;
  const client = QueryClientContext();
  if (!client) {
    throw new Error(
      "No QueryClient set, use QueryClientProvider to set one. Wrap the component in " +
        "<QueryClientProvider client={queryClient}>, or pass the client as the last argument (useQuery(options, queryClient)).",
    );
  }
  return client;
}

export interface QueryClientProviderProps {
  /** The client to provide. It is read once, when the provider is created. */
  client: QueryClient;
  children?: JSX.Element;
}

/**
 * Provides `client` to the components it renders. While it is mounted the client
 * listens to focus and connectivity (`client.mount()`), and NSH's platform
 * signals drive them (`connectNsh()`): queries refetch when the app comes back
 * to the foreground, the network returns or the system wakes.
 *
 * @example
 * ```tsx
 * const queryClient = new QueryClient();
 *
 * mount(() => (
 *   <QueryClientProvider client={queryClient}>
 *     <Todos />
 *   </QueryClientProvider>
 * ));
 * ```
 */
export function QueryClientProvider(props: QueryClientProviderProps): JSX.Element {
  const client = props.client;
  client.mount();
  cleanup(() => client.unmount());
  connectNsh();
  return QueryClientContext.Provider({
    value: client,
    get children() {
      return props.children;
    },
  });
}
