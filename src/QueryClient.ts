import { QueryClient as QueryCoreClient } from "./core";
import type { QueryClientConfig } from "./core";

/**
 * The query cache and the API around it: query-core's `QueryClient`, as is.
 *
 * Create one per app, outside components, and provide it with `QueryClientProvider`.
 *
 * @example
 * ```tsx
 * import { QueryClient, QueryClientProvider } from "nsh-query";
 *
 * const queryClient = new QueryClient({
 *   defaultOptions: { queries: { staleTime: 30_000 } },
 * });
 *
 * mount(() => (
 *   <QueryClientProvider client={queryClient}>
 *     <Todos />
 *   </QueryClientProvider>
 * ));
 * ```
 */
export class QueryClient extends QueryCoreClient {
  constructor(config: QueryClientConfig = {}) {
    super(config);
  }
}
