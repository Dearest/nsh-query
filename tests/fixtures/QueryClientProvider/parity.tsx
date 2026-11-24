import { ErrorBoundary, Text, View } from "nsh";
import { QueryCache, QueryClient, QueryClientProvider, useQuery, useQueryClient } from "nsh-query";
import { Button } from "../../support/Button";
import { createKey, log, runScenarios, sleep } from "../../support/parity";
import type { Scenario } from "../../support/parity";

const describeError = (error: unknown) => (error instanceof Error ? error.message : String(error));

const scenarios: Record<string, Scenario> = {
  "should set a specific cache for all queries to use": () => {
    const key = createKey();
    const queryCache = new QueryCache();
    const queryClient = new QueryClient({ queryCache });
    function Page() {
      const query = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test") }));
      return <Text>{query.data ?? ""}</Text>;
    }
    return (
      <View>
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
        <Button label="report" onPress={() => log({ data: queryCache.find({ queryKey: key })?.state.data })} />
      </View>
    );
  },

  "should allow multiple caches to be partitioned": () => {
    const key1 = createKey();
    const key2 = createKey();
    const queryCache1 = new QueryCache();
    const queryCache2 = new QueryCache();
    const queryClient1 = new QueryClient({ queryCache: queryCache1 });
    const queryClient2 = new QueryClient({ queryCache: queryCache2 });
    function Page1() {
      const query = useQuery(() => ({ queryKey: key1, queryFn: () => sleep(10).then(() => "test1") }));
      return <Text>{query.data ?? ""}</Text>;
    }
    function Page2() {
      const query = useQuery(() => ({ queryKey: key2, queryFn: () => sleep(10).then(() => "test2") }));
      return <Text>{query.data ?? ""}</Text>;
    }
    const report = () =>
      log({
        cache1key1: queryCache1.find({ queryKey: key1 })?.state.data,
        cache1key2: queryCache1.find({ queryKey: key2 }) === undefined,
        cache2key1: queryCache2.find({ queryKey: key1 }) === undefined,
        cache2key2: queryCache2.find({ queryKey: key2 })?.state.data,
      });
    return (
      <View>
        <QueryClientProvider client={queryClient1}>
          <Page1 />
        </QueryClientProvider>
        <QueryClientProvider client={queryClient2}>
          <Page2 />
        </QueryClientProvider>
        <Button label="report" onPress={report} />
      </View>
    );
  },

  "should use defaultOptions for queries when they don't provide their own config": () => {
    const key = createKey();
    const queryCache = new QueryCache();
    const queryClient = new QueryClient({ queryCache, defaultOptions: { queries: { gcTime: Infinity } } });
    function Page() {
      const query = useQuery(() => ({ queryKey: key, queryFn: () => sleep(10).then(() => "test") }));
      return <Text>{query.data ?? ""}</Text>;
    }
    return (
      <View>
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
        <Button
          label="report"
          onPress={() => log({ gcTime: String(queryCache.find({ queryKey: key })?.options.gcTime) })}
        />
      </View>
    );
  },

  "should throw an error if no query client has been set": () => {
    function Page() {
      useQueryClient();
      return <Text>rendered</Text>;
    }
    return (
      <ErrorBoundary fallback={(error) => <Text>{`thrown: ${describeError(error)}`}</Text>}>
        <Page />
      </ErrorBoundary>
    );
  },

  "should not throw an error if user provides custom query client": () => {
    function Page() {
      const client = new QueryClient();
      useQueryClient(client);
      return <Text>rendered</Text>;
    }
    return (
      <ErrorBoundary fallback={(error) => <Text>{`thrown: ${describeError(error)}`}</Text>}>
        <Page />
      </ErrorBoundary>
    );
  },
};

runScenarios(scenarios, { provider: false });
